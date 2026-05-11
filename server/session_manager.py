import uuid
import asyncio
import time
from datetime import datetime, timezone
from typing import Callable
from collections import Counter

from agents.agent import Agent
from core.selector import MetaAgent
from core.synthesis import SynthesisAgent
from chain.transcript import create_transcript
from chain.solana_client import SolanaClient
from server.database import SessionLocal, SessionModel, init_db
import config


def _is_valid_agent_response(response: dict) -> bool:
    """return false for transport/model failures that should not count as consensus."""
    answer = str(response.get("answer", "")).strip().lower()
    confidence = float(response.get("confidence", 0) or 0)
    return bool(answer) and answer not in {"api error", "error parsing output"} and confidence > 0


def _finalize_tally(responses: list[dict], agent_count: int, quorum_threshold: float, answer_key: str) -> dict:
    valid_responses = [
        resp for resp in responses
        if _is_valid_agent_response(resp.get("response", {}))
    ]

    if not valid_responses:
        return {
            answer_key: "No valid agent responses. API quota or model access prevented deliberation.",
            "confidence_score": 0.0,
            "quorum_reached": False,
            "vote_tally": {},
            "valid_response_count": 0,
            "failed_response_count": len(responses),
        }

    answers = [resp["response"].get("answer", "").strip().lower() for resp in valid_responses]
    vote_tally = dict(Counter(answers))
    
    # Find all answers with the maximum count (handle ties)
    max_count = max(vote_tally.values())
    tied_answers = [ans for ans, count in vote_tally.items() if count == max_count]
    
    # If there's a tie, prefer the answer from the first agent
    winning_answer_lower = tied_answers[0]
    winning_count = vote_tally[winning_answer_lower]

    winning_answer = winning_answer_lower
    for resp in valid_responses:
        if resp["response"].get("answer", "").strip().lower() == winning_answer_lower:
            winning_answer = resp["response"].get("answer", "").strip()
            break

    # calculate confidence based on valid responses, not total agent count
    confidence_score = winning_count / len(valid_responses) if valid_responses else 0.0

    return {
        answer_key: winning_answer,
        "confidence_score": confidence_score,
        "quorum_reached": confidence_score >= quorum_threshold,
        "vote_tally": vote_tally,
        "valid_response_count": len(valid_responses),
        "failed_response_count": len(responses) - len(valid_responses),
        "tie_detected": len(tied_answers) > 1,
    }


def _classify_session_mode(question: str) -> str:
    text = question.lower()
    if "dao" in text or "proposal" in text or "treasury" in text or "governance" in text:
        return "dao"
    if "bounty" in text or "escrow" in text:
        return "bounty"
    if "audit" in text or "smart contract" in text or "exploit" in text or "rust" in text:
        return "audit"
    return "general"


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
        # expose rounds so the frontend can rehydrate completed sessions.
        # vote sessions are normalized into a single round with index 0.
        normalized_rounds = None
        synthesis_report = None
        artifacts = []
        settlements = []
        if self.session_data:
            if self.session_data.get("rounds"):
                normalized_rounds = self.session_data["rounds"]
            elif self.session_data.get("responses"):
                normalized_rounds = [{"round": 0, "responses": self.session_data["responses"]}]
            synthesis_report = self.session_data.get("synthesis_report")
            artifacts = self.session_data.get("artifacts", [])
            settlements = self.session_data.get("settlements", [])
        return {
            "session_id": self.session_id,
            "question": self.question,
            "status": self.status,
            "mechanism": self.mechanism,
            "selector_result": self.selector_result,
            "transcript_hash": self.transcript_data["hash"] if self.transcript_data else None,
            "transcript_data": {"rounds": normalized_rounds} if normalized_rounds else None,
            "synthesis_report": synthesis_report,
            "artifacts": artifacts,
            "settlements": settlements,
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
    """manages all active and completed sessions with sqlite persistence."""

    def __init__(self):
        init_db()
        self.sessions: dict[str, Session] = {}
        self._load_from_db()

    def _load_from_db(self):
        """load past sessions into memory cache on startup."""
        db = SessionLocal()
        try:
            models = db.query(SessionModel).all()
            for m in models:
                s = Session(m.id, m.question, m.user_pubkey)
                s.status = m.status
                s.mechanism = m.mechanism
                s.selector_result = m.selector_result
                s.session_data = m.session_data
                s.chain_signature = m.chain_signature
                s.chain_verified = m.chain_verified
                s.created_at = m.created_at.isoformat() if m.created_at else s.created_at
                # transcript_data mock as we only store hash in DB
                if m.transcript_hash:
                    s.transcript_data = {"hash": m.transcript_hash}
                self.sessions[m.id] = s
            print(f"  [manager] loaded {len(models)} sessions from database.")
        finally:
            db.close()

    def _save_to_db(self, session: Session):
        """persist or update a session in the database."""
        db = SessionLocal()
        try:
            model = db.query(SessionModel).filter(SessionModel.id == session.session_id).first()
            if not model:
                model = SessionModel(id=session.session_id, question=session.question, user_pubkey=session.user_pubkey)
                db.add(model)
            
            model.status = session.status
            model.mechanism = session.mechanism
            model.selector_result = session.selector_result
            model.session_data = session.session_data
            model.transcript_hash = session.transcript_data["hash"] if session.transcript_data else None
            model.chain_signature = session.chain_signature
            model.chain_verified = session.chain_verified
            
            db.commit()
        except Exception as e:
            print(f"  [error] database save failed: {e}")
        finally:
            db.close()

    def create_session(self, question: str, user_pubkey: str = None, rounds: int = 3, quorum_threshold: float = 0.75) -> Session:
        session_id = str(uuid.uuid4())
        session = Session(session_id, question, user_pubkey, rounds, quorum_threshold)
        self.sessions[session_id] = session
        self._save_to_db(session)
        return session

    def get_session(self, session_id: str) -> Session | None:
        return self.sessions.get(session_id)

    def list_sessions(self, limit: int = 50) -> list[dict]:
        sorted_sessions = sorted(
            [
                session for session in self.sessions.values()
                if session.status == "complete" and session.session_data and session._get_final_answer()
            ],
            key=lambda s: s.created_at,
            reverse=True
        )
        return [s.to_dict() for s in sorted_sessions[:limit]]

    def _memory_context(self, question: str, limit: int = 3) -> str:
        keywords = {word.strip(".,:;!?()[]{}").lower() for word in question.split() if len(word.strip(".,:;!?()[]{}")) > 4}
        memories = []
        for previous in sorted(self.sessions.values(), key=lambda s: s.created_at, reverse=True):
            if previous.status != "complete" or not previous.session_data or previous.question == question:
                continue
            final_answer = previous._get_final_answer()
            if not final_answer or "no valid agent responses" in str(final_answer).lower() or "api quota" in str(final_answer).lower():
                continue
            previous_keywords = {word.strip(".,:;!?()[]{}").lower() for word in previous.question.split() if len(word.strip(".,:;!?()[]{}")) > 4}
            if keywords and not keywords.intersection(previous_keywords):
                continue
            previous_question = " ".join(previous.question.split())
            memories.append(f"- previous decision: {previous_question[:80]} -> {final_answer}")
            if len(memories) >= limit:
                break
        if not memories:
            return ""
        return "Relevant prior swarm memory:\n" + "\n".join(memories)

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

            agents = self._create_agents(session)
            memory_context = self._memory_context(session.question)
            if memory_context:
                session.emit("agent_memory", {"memory": memory_context})

            if session.mechanism == "debate":
                session_data = await self._run_debate(session.question, session, agents, memory_context)
            else:
                session_data = await self._run_vote(session.question, session, agents, memory_context)

            session.session_data = session_data

            # step 3: quorum check
            quorum = session_data.get("quorum_reached", False)
            final_answer = session_data.get("final_answer", session_data.get("winning_answer", "N/A"))
            session.emit("quorum_result", {
                "quorum_reached": quorum,
                "final_answer": final_answer,
                "confidence_score": session_data.get("confidence_score", 0),
            })

            valid_response_count = session_data.get("valid_response_count", 0)
            if not quorum and session.mechanism == "debate" and valid_response_count > 0:
                session.status = "synthesizing"
                session.emit("status", {"status": "synthesizing", "message": "No quorum. Synthesizing compromise report..."})
                
                syn_agent = SynthesisAgent()
                rounds_data = session_data.get("rounds", [])
                try:
                    synthesis = await asyncio.wait_for(
                        asyncio.to_thread(syn_agent.synthesize, session.question, rounds_data),
                        timeout=70.0
                    )
                except asyncio.TimeoutError:
                    synthesis = {
                        "summary": "Consensus synthesis timed out.",
                        "agreement": [],
                        "disagreement": [],
                        "synthesis": final_answer
                    }
                
                session.session_data["synthesis_report"] = synthesis
                session.emit("synthesis_report", synthesis)

            session.status = "hashing"
            session.emit("status", {"status": "hashing", "message": "Hashing transcript..."})

            transcript_data = create_transcript(
                session.mechanism,
                selector_result["reasoning"],
                session.session_data
            )
            session.transcript_data = transcript_data
            session.emit("transcript_hashed", {
                "hash": transcript_data["hash"],
                "session_id": transcript_data["session_id"],
            })

            if True:
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

                    verification = await asyncio.to_thread(client.verify_on_chain, signature)
                    session.chain_verified = verification.get("verified", False)

                    session.emit("chain_receipt", {
                        "signature": signature,
                        "verified": session.chain_verified,
                        "explorer_url": f"https://explorer.solana.com/tx/{signature}?cluster=devnet",
                    })

                    artifact_signature = await asyncio.to_thread(
                        client.log_decision_artifact,
                        session.session_id,
                        transcript_data["hash"],
                        final_answer,
                        quorum,
                        session_data.get("confidence_score", 0),
                    )
                    session.emit("artifact_receipt", {
                        "type": "decision_artifact",
                        "signature": artifact_signature,
                        "explorer_url": f"https://explorer.solana.com/tx/{artifact_signature}?cluster=devnet",
                    })
                    session.session_data.setdefault("artifacts", []).append({
                        "type": "decision_artifact",
                        "signature": artifact_signature,
                        "explorer_url": f"https://explorer.solana.com/tx/{artifact_signature}?cluster=devnet",
                    })

                    mode = _classify_session_mode(session.question)
                    if mode == "dao":
                        dao_signature = await asyncio.to_thread(client.log_governance_result, session.session_id, transcript_data["hash"], final_answer)
                        session.emit("artifact_receipt", {
                            "type": "dao_prevote",
                            "signature": dao_signature,
                            "explorer_url": f"https://explorer.solana.com/tx/{dao_signature}?cluster=devnet",
                        })
                        session.session_data.setdefault("artifacts", []).append({
                            "type": "dao_prevote",
                            "signature": dao_signature,
                            "explorer_url": f"https://explorer.solana.com/tx/{dao_signature}?cluster=devnet",
                        })
                    elif mode == "bounty":
                        bounty_signature = await asyncio.to_thread(client.log_bounty_resolution, session.session_id, transcript_data["hash"], 0.05, True)
                        session.emit("artifact_receipt", {
                            "type": "bounty_resolution",
                            "signature": bounty_signature,
                            "explorer_url": f"https://explorer.solana.com/tx/{bounty_signature}?cluster=devnet",
                        })
                        session.session_data.setdefault("artifacts", []).append({
                            "type": "bounty_resolution",
                            "signature": bounty_signature,
                            "explorer_url": f"https://explorer.solana.com/tx/{bounty_signature}?cluster=devnet",
                        })
                    
                    rounds_data = session_data.get("rounds", [])
                    if rounds_data:
                        from agents.reputation import compute_reputation_delta, get_agent_id
                        for resp in rounds_data[-1].get("responses", []):
                            ans = resp.get("response", {}).get("answer", "")
                            conf = resp.get("response", {}).get("confidence", 0.0)
                            agent_id = get_agent_id(resp.get("persona", ""))
                            delta = compute_reputation_delta(ans, final_answer, conf, quorum)
                            if agent_id:
                                rep_signature = await asyncio.to_thread(client.log_agent_reputation, agent_id, session.session_id, delta)
                                matched = ans.strip().lower() == final_answer.strip().lower()
                                stake_signature = await asyncio.to_thread(client.log_staking_settlement, session.session_id, agent_id, 0.05, delta / 100, matched)
                                session.emit("agent_settlement", {
                                    "agent_id": agent_id,
                                    "persona": resp.get("persona", ""),
                                    "reputation_delta": delta,
                                    "stake_delta_sol": round(delta / 100, 4),
                                    "matched_consensus": matched,
                                    "reputation_signature": rep_signature,
                                    "stake_signature": stake_signature,
                                    "explorer_url": f"https://explorer.solana.com/tx/{stake_signature}?cluster=devnet",
                                })
                                session.session_data.setdefault("settlements", []).append({
                                    "agent_id": agent_id,
                                    "persona": resp.get("persona", ""),
                                    "reputation_delta": delta,
                                    "stake_delta_sol": round(delta / 100, 4),
                                    "matched_consensus": matched,
                                    "reputation_signature": rep_signature,
                                    "stake_signature": stake_signature,
                                    "explorer_url": f"https://explorer.solana.com/tx/{stake_signature}?cluster=devnet",
                                })

                except Exception as e:
                    session.emit("chain_error", {"error": str(e)})

            # done
            session.status = "complete"
            self._save_to_db(session)
            session.emit("status", {"status": "complete", "message": "Session complete."})
            session.emit("session_complete", session.to_dict())

        except Exception as e:
            session.status = "failed"
            session.emit("error", {"error": str(e)})
            session.emit("status", {"status": "failed", "message": f"Session failed: {str(e)}"})

    def _run_selector(self, question: str) -> dict:
        meta = MetaAgent()
        return meta.analyze(question)

    async def _run_debate(self, question: str, session: Session, agents: list[Agent], memory_context: str = "") -> dict:
        """run debate with event emissions for each agent action."""
        all_rounds = []

        session.emit("debate_start", {
            "agent_count": len(agents),
            "rounds": session.rounds,
            "agents": [{"name": a.name, "persona": a.persona_type} for a in agents]
        })
        position_changes = []

        # round 0: sequential deliberation
        session.emit("round_start", {"round": 0, "type": "deliberation"})
        round_responses = []
        for agent in agents:
            peer_opinions = [
                resp for resp in round_responses
                if _is_valid_agent_response(resp.get("response", {}))
            ]
            session.emit("agent_thinking", {
                "agent": agent.name,
                "persona": agent.persona_type,
                "round": 0,
                "peers": len(peer_opinions)
            })
            result = await agent.generate_response(question, memory_context, peer_opinions)
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
            await asyncio.sleep(1) 
        
        all_rounds.append({"round": 0, "responses": round_responses})
        session.emit("round_complete", {"round": 0})

        final_responses = all_rounds[-1]["responses"]
        tally_result = _finalize_tally(
            final_responses,
            len(agents),
            session.quorum_threshold,
            "final_answer"
        )

        return {
            "mechanism": "debate",
            "question": question,
            "rounds": all_rounds,
            "final_answer": tally_result["final_answer"],
            "confidence_score": tally_result["confidence_score"],
            "agent_count": len(agents),
            "quorum_reached": tally_result["quorum_reached"],
            "position_changes": position_changes,
            "vote_tally": tally_result["vote_tally"],
            "valid_response_count": tally_result["valid_response_count"],
            "failed_response_count": tally_result["failed_response_count"],
        }

    async def _run_vote(self, question: str, session: Session, agents: list[Agent], memory_context: str = "") -> dict:
        """run vote with event emissions for each agent action."""
        responses = []

        session.emit("vote_start", {
            "agent_count": len(agents),
            "agents": [{"name": a.name, "persona": a.persona_type} for a in agents]
        })

        for agent in agents:
            session.emit("agent_thinking", {"agent": agent.name, "persona": agent.persona_type, "round": 0})
            result = await agent.generate_response(question, memory_context)
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
            await asyncio.sleep(2)

        tally_result = _finalize_tally(
            responses,
            len(agents),
            session.quorum_threshold,
            "winning_answer"
        )

        return {
            "mechanism": "vote",
            "question": question,
            "responses": responses,
            "vote_tally": tally_result["vote_tally"],
            "winning_answer": tally_result["winning_answer"],
            "confidence_score": tally_result["confidence_score"],
            "agent_count": len(agents),
            "quorum_reached": tally_result["quorum_reached"],
            "valid_response_count": tally_result["valid_response_count"],
            "failed_response_count": tally_result["failed_response_count"],
        }

    def _create_agents(self, session: Session) -> list[Agent]:
        """initialize agents for the session with rate-limit tracking."""
        keys = config.API_KEYS
        personas = list(Agent.PERSONAS.keys())
        
        def on_agent_retry(name, attempt, delay):
            wait_message = "Trying another configured provider..." if delay == 0 else f"Waiting {delay}s before retry..."
            session.emit("agent_retry", {
                "agent": name,
                "attempt": attempt,
                "delay": delay,
                "message": wait_message
            })

        agents = []
        for i in range(config.NUM_AGENTS):
            p_type = personas[i % len(personas)]
            agents.append(Agent(
                name=f"Agent_{i+1}_{p_type}", 
                persona_type=p_type, 
                api_keys=keys,
                on_retry=on_agent_retry,
                start_key_index=0
            ))
        return agents
