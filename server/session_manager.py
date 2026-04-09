import uuid
import asyncio
import time
from datetime import datetime, timezone
from typing import Callable
from collections import Counter

from agents.agent import Agent
from core.selector import MetaAgent
from chain.transcript import create_transcript
from chain.solana_client import SolanaClient
import config


class SessionEvent:
    """a single event emitted during a session for sse streaming."""
    def __init__(self, event_type: str, data: dict):
        self.event_type = event_type
        self.data = data
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self):
        return {
            "event": self.event_type,
            "data": self.data,
            "timestamp": self.timestamp
        }


class Session:
    """represents a single debate/vote session with its full lifecycle."""
    def __init__(self, session_id: str, question: str, user_pubkey: str = None, rounds: int = 3, quorum_threshold: float = 0.75):
        self.session_id = session_id
        self.question = question
        self.user_pubkey = user_pubkey
        self.rounds = rounds
        self.quorum_threshold = quorum_threshold
        self.status = "pending"  # pending -> selecting -> running -> hashing -> chain -> complete / failed
        self.mechanism = None
        self.selector_result = None
        self.session_data = None
        self.transcript_data = None
        self.chain_signature = None
        self.chain_verified = False
        self.events: list[SessionEvent] = []
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.created_at = datetime.now(timezone.utc).isoformat()

    def emit(self, event_type: str, data: dict):
        """emit an event to both the history and the live queue."""
        event = SessionEvent(event_type, data)
        self.events.append(event)
        self.event_queue.put_nowait(event)

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "question": self.question,
            "status": self.status,
            "mechanism": self.mechanism,
            "selector_result": self.selector_result,
            "transcript_hash": self.transcript_data["hash"] if self.transcript_data else None,
            "chain_signature": self.chain_signature,
            "chain_verified": self.chain_verified,
            "created_at": self.created_at,
            "final_answer": self._get_final_answer(),
            "quorum_reached": self._get_quorum(),
            "confidence_score": self._get_confidence(),
            "agent_count": config.NUM_AGENTS,
        }

    def _get_final_answer(self):
        if not self.session_data:
            return None
        return self.session_data.get("final_answer", self.session_data.get("winning_answer"))

    def _get_quorum(self):
        if not self.session_data:
            return None
        return self.session_data.get("quorum_reached")

    def _get_confidence(self):
        if not self.session_data:
            return None
        return self.session_data.get("confidence_score")


class SessionManager:
    """manages all active and completed sessions."""

    def __init__(self):
        self.sessions: dict[str, Session] = {}

    def create_session(self, question: str, user_pubkey: str = None, rounds: int = 3, quorum_threshold: float = 0.75) -> Session:
        session_id = str(uuid.uuid4())
        session = Session(session_id, question, user_pubkey, rounds, quorum_threshold)
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        return self.sessions.get(session_id)

    def list_sessions(self, limit: int = 20) -> list[dict]:
        sorted_sessions = sorted(
            self.sessions.values(),
            key=lambda s: s.created_at,
            reverse=True
        )
        return [s.to_dict() for s in sorted_sessions[:limit]]

    async def run_session(self, session: Session):
        """execute the full pipeline asynchronously, emitting events at each step."""
        try:
            # step 1: meta-agent selector
            session.status = "selecting"
            session.emit("status", {"status": "selecting", "message": "Meta-agent analyzing question..."})

            selector_result = await asyncio.to_thread(self._run_selector, session.question)
            session.mechanism = selector_result["mechanism"]
            session.selector_result = selector_result
            session.emit("selector_decision", {
                "mechanism": selector_result["mechanism"],
                "reasoning": selector_result["reasoning"],
                "confidence": selector_result["confidence"],
                "source": selector_result["source"]
            })

            # step 2: run debate or vote
            session.status = "running"
            session.emit("status", {"status": "running", "message": f"Starting {session.mechanism}..."})

            if session.mechanism == "debate":
                session_data = await asyncio.to_thread(
                    self._run_debate, session.question, session
                )
            else:
                session_data = await asyncio.to_thread(
                    self._run_vote, session.question, session
                )

            session.session_data = session_data

            # step 3: quorum check
            quorum = session_data.get("quorum_reached", False)
            final_answer = session_data.get("final_answer", session_data.get("winning_answer", "N/A"))
            session.emit("quorum_result", {
                "quorum_reached": quorum,
                "final_answer": final_answer,
                "confidence_score": session_data.get("confidence_score", 0),
            })

            # step 4: transcript hashing
            if quorum:
                session.status = "hashing"
                session.emit("status", {"status": "hashing", "message": "Hashing transcript..."})

                transcript_data = create_transcript(
                    session.mechanism,
                    selector_result["reasoning"],
                    session_data
                )
                session.transcript_data = transcript_data
                session.emit("transcript_hashed", {
                    "hash": transcript_data["hash"],
                    "session_id": transcript_data["session_id"],
                })

                # step 5: on-chain logging
                session.status = "chain"
                session.emit("status", {"status": "chain", "message": "Writing to Solana Devnet..."})

                try:
                    client = SolanaClient()
                    signature = await asyncio.to_thread(
                        client.log_hash_to_chain,
                        transcript_data["session_id"],
                        transcript_data["hash"]
                    )
                    session.chain_signature = signature

                    # verify
                    verification = await asyncio.to_thread(client.verify_on_chain, signature)
                    session.chain_verified = verification.get("verified", False)

                    session.emit("chain_receipt", {
                        "signature": signature,
                        "verified": session.chain_verified,
                        "explorer_url": f"https://explorer.solana.com/tx/{signature}?cluster=devnet",
                    })
                    
                    # Log reputation for all agents in the background
                    final_round = getattr(session_data, "get", lambda x: None)("rounds", [])
                    if final_round:
                        for resp in final_round[-1].get("responses", []):
                            ans = resp.get("response", {}).get("answer", "")
                            conf = resp.get("response", {}).get("confidence", 0.0)
                            from agents.reputation import compute_reputation_delta, get_agent_id
                            agent_id = get_agent_id(resp.get("persona", ""))
                            delta = compute_reputation_delta(ans, final_answer, conf, quorum)
                            if agent_id:
                                await asyncio.to_thread(client.log_agent_reputation, agent_id, session.session_id, delta)

                except Exception as e:
                    session.emit("chain_error", {"error": str(e)})

            # done
            session.status = "complete"
            session.emit("status", {"status": "complete", "message": "Session complete."})
            session.emit("session_complete", session.to_dict())

        except Exception as e:
            session.status = "failed"
            session.emit("error", {"error": str(e)})
            session.emit("status", {"status": "failed", "message": f"Session failed: {str(e)}"})

    def _run_selector(self, question: str) -> dict:
        meta = MetaAgent()
        return meta.analyze(question)

    def _run_debate(self, question: str, session: Session) -> dict:
        """run debate with event emissions for each agent action."""
        agents = self._create_agents()
        all_rounds = []
        position_changes = []

        session.emit("debate_start", {
            "agent_count": len(agents),
            "rounds": session.rounds,
            "agents": [{"name": a.name, "persona": a.persona_type} for a in agents]
        })

        # round 0: initial opinions
        session.emit("round_start", {"round": 0, "type": "initial"})
        round_responses = []
        for agent in agents:
            session.emit("agent_thinking", {"agent": agent.name, "persona": agent.persona_type, "round": 0})
            result = agent.generate_response(question=question)
            round_responses.append({
                "name": agent.name,
                "persona": agent.persona_type,
                "response": result
            })
            session.emit("agent_response", {
                "agent": agent.name,
                "persona": agent.persona_type,
                "round": 0,
                "answer": result.get("answer", "N/A"),
                "confidence": result.get("confidence", 0),
                "reasoning": result.get("reasoning", ""),
            })
            time.sleep(1)

        all_rounds.append({"round": 0, "responses": round_responses})
        session.emit("round_complete", {"round": 0})

        # rounds 1-N: debate with peer opinions
        for r in range(1, session.rounds + 1):
            session.emit("round_start", {"round": r, "type": "debate"})
            previous_responses = all_rounds[-1]["responses"]
            new_round_responses = []

            for agent in agents:
                peer_opinions = [
                    resp for resp in previous_responses
                    if resp["name"] != agent.name
                ]
                session.emit("agent_thinking", {
                    "agent": agent.name, "persona": agent.persona_type,
                    "round": r, "peers": len(peer_opinions)
                })

                result = agent.generate_response(
                    question=question,
                    peer_opinions=peer_opinions
                )
                new_round_responses.append({
                    "name": agent.name,
                    "persona": agent.persona_type,
                    "response": result
                })

                # track position changes
                prev_answer = None
                for prev_resp in previous_responses:
                    if prev_resp["name"] == agent.name:
                        prev_answer = prev_resp["response"].get("answer", "").strip().lower()
                        break
                new_answer = result.get("answer", "").strip().lower()
                changed = prev_answer and new_answer and prev_answer != new_answer

                if changed:
                    position_changes.append({
                        "agent": agent.name,
                        "round": r,
                        "old_answer": prev_answer,
                        "new_answer": new_answer
                    })

                session.emit("agent_response", {
                    "agent": agent.name,
                    "persona": agent.persona_type,
                    "round": r,
                    "answer": result.get("answer", "N/A"),
                    "confidence": result.get("confidence", 0),
                    "reasoning": result.get("reasoning", ""),
                    "position_changed": changed,
                    "old_answer": prev_answer if changed else None,
                })
                time.sleep(1)

            all_rounds.append({"round": r, "responses": new_round_responses})
            session.emit("round_complete", {"round": r})

        # determine final answer from last round via majority
        final_responses = all_rounds[-1]["responses"]
        answers = [resp["response"].get("answer", "").strip().lower() for resp in final_responses]
        vote_tally = Counter(answers)
        winning_answer_lower = vote_tally.most_common(1)[0][0]
        winning_count = vote_tally.most_common(1)[0][1]

        winning_answer = winning_answer_lower
        for resp in final_responses:
            if resp["response"].get("answer", "").strip().lower() == winning_answer_lower:
                winning_answer = resp["response"]["answer"].strip()
                break

        confidence_score = winning_count / len(agents)
        quorum_reached = confidence_score >= session.quorum_threshold

        return {
            "mechanism": "debate",
            "question": question,
            "rounds": all_rounds,
            "final_answer": winning_answer,
            "confidence_score": confidence_score,
            "agent_count": len(agents),
            "quorum_reached": quorum_reached,
            "position_changes": position_changes,
        }

    def _run_vote(self, question: str, session: Session) -> dict:
        """run vote with event emissions for each agent action."""
        agents = self._create_agents()
        responses = []

        session.emit("vote_start", {
            "agent_count": len(agents),
            "agents": [{"name": a.name, "persona": a.persona_type} for a in agents]
        })

        for agent in agents:
            session.emit("agent_thinking", {"agent": agent.name, "persona": agent.persona_type, "round": 0})
            result = agent.generate_response(question=question)
            responses.append({
                "name": agent.name,
                "persona": agent.persona_type,
                "response": result
            })
            session.emit("agent_response", {
                "agent": agent.name,
                "persona": agent.persona_type,
                "round": 0,
                "answer": result.get("answer", "N/A"),
                "confidence": result.get("confidence", 0),
                "reasoning": result.get("reasoning", ""),
            })
            time.sleep(1)

        # tally
        answers = [r["response"].get("answer", "").strip().lower() for r in responses]
        vote_tally = dict(Counter(answers))
        winning_answer_lower = max(vote_tally, key=vote_tally.get)
        winning_count = vote_tally[winning_answer_lower]

        winning_answer = winning_answer_lower
        for r in responses:
            if r["response"].get("answer", "").strip().lower() == winning_answer_lower:
                winning_answer = r["response"]["answer"].strip()
                break

        confidence_score = winning_count / len(agents)
        quorum_reached = confidence_score >= session.quorum_threshold

        return {
            "mechanism": "vote",
            "question": question,
            "responses": responses,
            "vote_tally": vote_tally,
            "winning_answer": winning_answer,
            "confidence_score": confidence_score,
            "agent_count": len(agents),
            "quorum_reached": quorum_reached,
        }

    def _create_agents(self) -> list[Agent]:
        """create agents with rotating api keys."""
        persona_types = list(Agent.PERSONAS.keys())
        agents = []
        num_keys = len(config.GEMINI_API_KEYS)

        for i in range(config.NUM_AGENTS):
            persona = persona_types[i % len(persona_types)]
            name = f"Agent_{i+1}_{persona}"
            assigned_key = config.GEMINI_API_KEYS[i % num_keys]
            agents.append(Agent(name=name, persona_type=persona, api_key=assigned_key))
        return agents
