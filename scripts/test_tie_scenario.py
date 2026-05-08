import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import config
from core.llm_client import LLMClient
from core.selector import decide_mechanism
from core.vote import run_vote
from core.debate import run_debate


# Ambiguous prompts designed to cause disagreement
TIE_SCENARIOS = [
    {
        "name": "Ethical Dilemma - AI Bias",
        "prompt": "Should a hiring AI system be allowed to use demographic data to correct historical bias, even if it means explicitly considering race/gender in decisions? This involves trade-offs between fairness, privacy, and legal compliance."
    },
    {
        "name": "Policy Decision - UBI",
        "prompt": "Should a country implement Universal Basic Income? Consider economic impact, inflation risks, work incentive effects, and social welfare benefits. There are valid arguments on both sides."
    },
    {
        "name": "Technical Trade-off - Privacy vs Security",
        "prompt": "Should a messaging app implement client-side scanning for illegal content (CSAM) to protect children, even if it requires analyzing all user messages and could be abused for surveillance? This is a genuine technical and ethical debate."
    },
    {
        "name": "Blockchain Governance",
        "prompt": "Should a decentralized protocol implement a governance mechanism that allows token holders to reverse malicious transactions, even if it breaks the 'code is law' principle and introduces centralization risks?"
    }
]


def test_scenario(scenario):
    print(f"\n{'='*80}")
    print(f"Testing: {scenario['name']}")
    print(f"{'='*80}")
    print(f"Prompt: {scenario['prompt'][:200]}...")
    
    # First test mechanism selection
    mechanism, reason = decide_mechanism(scenario['prompt'])
    print(f"\nSelector chose: {mechanism.upper()}")
    print(f"Reasoning: {reason}")
    
    # Run the chosen mechanism
    if mechanism == "debate":
        session_data = asyncio.run(run_debate(scenario['prompt']))
    else:
        session_data = asyncio.run(run_vote(scenario['prompt']))
    
    # Check for split/tie
    quorum_reached = session_data.get("quorum_reached", False)
    final_answer = session_data.get("final_answer", session_data.get("winning_answer", "N/A"))
    
    print(f"\nQuorum reached: {quorum_reached}")
    print(f"Final answer: {final_answer}")
    
    # Check vote distribution if available
    if "vote_distribution" in session_data:
        print(f"Vote distribution: {session_data['vote_distribution']}")
    
    if "rounds" in session_data and session_data["rounds"]:
        last_round = session_data["rounds"][-1]
        if "responses" in last_round:
            print(f"\nLast round responses:")
            for resp in last_round["responses"]:
                print(f"  - {resp.get('persona', 'Unknown')}: {resp.get('answer', resp.get('content', ''))[:100]}...")
    
    return {
        "name": scenario['name'],
        "mechanism": mechanism,
        "quorum_reached": quorum_reached,
        "final_answer": final_answer
    }


def main():
    print("Testing scenarios designed to produce ties/split decisions...")
    print("This will help identify prompts that create genuine disagreement among agents.\n")
    
    results = []
    for scenario in TIE_SCENARIOS[:2]:  # Test first 2 to start
        try:
            result = test_scenario(scenario)
            results.append(result)
        except Exception as e:
            print(f"\nERROR in {scenario['name']}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    for result in results:
        print(f"{result['name']}: {result['mechanism']} -> Quorum: {result['quorum_reached']}")


if __name__ == "__main__":
    main()
