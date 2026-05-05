import time
from agents.agent import Agent
from core.vote import create_agents
import config


def run_debate(question: str, context: str = "", num_agents: int = None,
               num_rounds: int = None) -> dict:
    """
    multi-round debate loop.
    round 0: all agents answer independently.
    rounds 1-N: each agent sees all peer responses from the previous round
    and updates their position (decentralized topology).
    returns: {
        "mechanism": "debate",
        "question": question,
        "rounds": [
            {
                "round": int,
                "responses": [{name, persona, response}, ...]
            }, ...
        ],
        "final_answer": str,
        "confidence_score": float,
        "agent_count": int,
        "quorum_reached": bool,
        "position_changes": [{agent, round, old_answer, new_answer}, ...]
    }
    """
    if num_agents is None:
        num_agents = config.NUM_AGENTS
    if num_rounds is None:
        num_rounds = config.DEBATE_ROUNDS

    agents = create_agents(num_agents)
    all_rounds = []
    position_changes = []

    print(f"\n{'='*60}")
    print(f"DEBATE MECHANISM - {len(agents)} agents, {num_rounds} rounds")
    print(f"Question: {question}")
    print(f"{'='*60}")

    # round 0: independent answers (no peer opinions)
    print(f"\n--- Round 0: Initial Opinions ---")
    round_responses = []
    for agent in agents:
        print(f"  [{agent.name}] thinking...")
        result = agent.generate_response_sync(question=question, context=context)
        round_responses.append({
            "name": agent.name,
            "persona": agent.persona_type,
            "response": result
        })
        print(f"  [{agent.name}] answer: {result.get('answer', 'N/A')} "
              f"(confidence: {result.get('confidence', 0)})")
        time.sleep(1)

    all_rounds.append({
        "round": 0,
        "responses": round_responses
    })

    # rounds 1-N: each agent sees all peer responses
    for r in range(1, num_rounds + 1):
        print(f"\n--- Round {r}: Debate ---")
        previous_responses = all_rounds[-1]["responses"]
        new_round_responses = []

        for agent in agents:
            # build peer opinions list (everyone except self)
            peer_opinions = [
                resp for resp in previous_responses
                if resp["name"] != agent.name
            ]

            print(f"  [{agent.name}] deliberating with {len(peer_opinions)} peer opinions...")
            result = agent.generate_response_sync(
                question=question,
                context=context,
                peer_opinions=peer_opinions
            )
            new_round_responses.append({
                "name": agent.name,
                "persona": agent.persona_type,
                "response": result
            })
            print(f"  [{agent.name}] answer: {result.get('answer', 'N/A')} "
                  f"(confidence: {result.get('confidence', 0)})")

            # track position changes
            prev_answer = None
            for prev_resp in previous_responses:
                if prev_resp["name"] == agent.name:
                    prev_answer = prev_resp["response"].get("answer", "").strip().lower()
                    break
            new_answer = result.get("answer", "").strip().lower()
            if prev_answer and new_answer and prev_answer != new_answer:
                position_changes.append({
                    "agent": agent.name,
                    "round": r,
                    "old_answer": prev_answer,
                    "new_answer": new_answer
                })
                print(f"    ^ POSITION CHANGED: '{prev_answer}' -> '{new_answer}'")

            time.sleep(1)

        all_rounds.append({
            "round": r,
            "responses": new_round_responses
        })

        if r >= 1:
            consensus_answer, consensus_score = _check_semantic_consensus(new_round_responses)
            if consensus_score >= config.QUORUM_THRESHOLD:
                print(f"  [consensus] QUORUM REACHED EARLY in round {r} ({consensus_score:.2f})!")
                winning_answer = consensus_answer
                winning_count = round(consensus_score * len(agents))
                confidence_score = consensus_score
                quorum_reached = True
                break

    # determine final answer (if not reached early)
    if not quorum_reached:
        final_responses = all_rounds[-1]["responses"]
        from collections import Counter
        answers = [
            resp["response"].get("answer", "").strip().lower()
            for resp in final_responses
        ]
        vote_tally = Counter(answers)
        winning_answer_lower = vote_tally.most_common(1)[0][0]
        winning_count = vote_tally.most_common(1)[0][1]

        # get original-cased version
        winning_answer = winning_answer_lower
        for resp in final_responses:
            if resp["response"].get("answer", "").strip().lower() == winning_answer_lower:
                winning_answer = resp["response"]["answer"].strip()
                break

        confidence_score = winning_count / len(agents)
        quorum_reached = confidence_score >= config.QUORUM_THRESHOLD

    # ... remaining code ...

    print(f"\n{'='*60}")
    print(f"DEBATE RESULTS (after {num_rounds} rounds):")
    print(f"  Final Answer: {winning_answer} ({winning_count}/{len(agents)} agree)")
    print(f"  Confidence: {confidence_score:.2f}")
    print(f"  Position Changes: {len(position_changes)}")
    print(f"  Quorum: {'REACHED' if quorum_reached else 'NOT REACHED'} "
          f"(threshold: {config.QUORUM_THRESHOLD})")
    print(f"{'='*60}\n")

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


def _check_semantic_consensus(responses: list) -> tuple[str, float]:
    """
    Analyzes responses to see if a quorum of agents agree on the same core answer.
    In a true production environment, this would use a small 'Judge' LLM 
    or semantic similarity embeddings. Here we use normalized frequency.
    """
    from collections import Counter
    answers = []
    for r in responses:
        ans = r["response"].get("answer", "").strip().lower()
        # strip punctuation for better matching
        ans = "".join(c for c in ans if c.isalnum() or c.isspace())
        answers.append(ans)
    
    tally = Counter(answers)
    if not tally:
        return "", 0.0
        
    most_common_ans, count = tally.most_common(1)[0]
    score = count / len(responses)
    
    # find original-case answer
    original_ans = most_common_ans
    for r in responses:
        if r["response"].get("answer", "").strip().lower().replace(".", "") == most_common_ans:
            original_ans = r["response"]["answer"]
            break
            
    return original_ans, score
