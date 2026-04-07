import time
from collections import Counter
from agents.agent import Agent
import config


def create_agents(num_agents: int = None) -> list:
    """
    create a list of agents with rotating personas.
    returns list of Agent instances.
    """
    if num_agents is None:
        num_agents = config.NUM_AGENTS

    persona_types = list(Agent.PERSONAS.keys())
    agents = []
    num_keys = len(config.GEMINI_API_KEYS)

    for i in range(num_agents):
        persona = persona_types[i % len(persona_types)]
        name = f"Agent_{i+1}_{persona}"
        assigned_key = config.GEMINI_API_KEYS[i % num_keys]
        agents.append(Agent(name=name, persona_type=persona, api_key=assigned_key))
    return agents


def run_vote(question: str, context: str = "", num_agents: int = None) -> dict:
    """
    all agents answer independently (no peer opinions).
    majority vote determines outcome.
    returns: {
        "mechanism": "vote",
        "question": question,
        "responses": [{name, persona, response}, ...],
        "vote_tally": {"answer": count, ...},
        "winning_answer": str,
        "confidence_score": float,
        "agent_count": int,
        "quorum_reached": bool
    }
    """
    agents = create_agents(num_agents)
    responses = []

    print(f"\n{'='*60}")
    print(f"VOTE MECHANISM — {len(agents)} agents voting independently")
    print(f"Question: {question}")
    print(f"{'='*60}\n")

    for agent in agents:
        print(f"  [{agent.name}] voting...")
        result = agent.generate_response(question=question, context=context)
        responses.append({
            "name": agent.name,
            "persona": agent.persona_type,
            "response": result
        })
        print(f"  [{agent.name}] answer: {result.get('answer', 'N/A')} "
              f"(confidence: {result.get('confidence', 0)})")
        # small delay to avoid rate limiting
        time.sleep(1)

    # tally votes by normalized answer
    answers = []
    for r in responses:
        answer = r["response"].get("answer", "").strip().lower()
        answers.append(answer)

    vote_tally = dict(Counter(answers))

    # determine winner
    winning_answer_lower = max(vote_tally, key=vote_tally.get)
    winning_count = vote_tally[winning_answer_lower]

    # get the original-cased version of the winning answer
    winning_answer = winning_answer_lower
    for r in responses:
        if r["response"].get("answer", "").strip().lower() == winning_answer_lower:
            winning_answer = r["response"]["answer"].strip()
            break

    # confidence score = fraction of agents that agree with majority
    confidence_score = winning_count / len(agents)

    # quorum check
    quorum_reached = confidence_score >= config.QUORUM_THRESHOLD

    print(f"\n{'='*60}")
    print(f"VOTE RESULTS:")
    print(f"  Tally: {vote_tally}")
    print(f"  Winner: {winning_answer} ({winning_count}/{len(agents)} votes)")
    print(f"  Confidence: {confidence_score:.2f}")
    print(f"  Quorum: {'REACHED' if quorum_reached else 'NOT REACHED'} "
          f"(threshold: {config.QUORUM_THRESHOLD})")
    print(f"{'='*60}\n")

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
