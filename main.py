import sys
import argparse
from core.selector import decide_mechanism
from core.vote import run_vote
from core.debate import run_debate
from chain.transcript import create_transcript
from chain.solana_client import SolanaClient

def main():
    parser = argparse.ArgumentParser(description="SWARMs Debate Primitive")
    parser.add_argument("question", nargs="?", help="The question to pose to the agents")
    args = parser.parse_args()

    question = args.question
    if not question:
        question = input("Enter your question: ").strip()

    if not question:
        print("A question is required.")
        sys.exit(1)

    print("\n" + "="*80)
    print(" SWARMs DEBATE PRIMITIVE ")
    print("="*80 + "\n")

    # 1. Decide Mechanism
    mechanism, reason = decide_mechanism(question)
    print(f"STEP 1: SELECTOR DECISION")
    print(f"  Mechanism: {mechanism.upper()}")
    print(f"  Reasoning: {reason}\n")

    # 2. Run Mechanism
    print(f"STEP 2: AGENT COORDINATION")
    if mechanism == "debate":
        session_data = run_debate(question)
    else:
        session_data = run_vote(question)

    # 3. Check Quorum
    quorum_reached = session_data.get("quorum_reached", False)
    final_answer = session_data.get("final_answer", session_data.get("winning_answer", "N/A"))
    
    print(f"\nSTEP 3: QUORUM CHECK")
    print(f"  Final Answer: {final_answer}")
    if quorum_reached:
        print(f"  Status: REACHED (Confidence: {session_data.get('confidence_score', 0):.2f})")
    else:
        print(f"  Status: NOT REACHED (Coordination Failed)")

    # 4 & 5. Transcript & Solana
    if quorum_reached:
        print(f"\nSTEP 4: TRANSCRIPT HASHING & ON-CHAIN STORAGE")
        # Serialize + Hash
        transcript_data = create_transcript(mechanism, reason, session_data)
        
        try:
            client = SolanaClient()
            signature = client.log_hash_to_chain(transcript_data["session_id"], transcript_data["hash"])
            
            print(f"\n" + "="*80)
            print(" ON-CHAIN RECEIPT ")
            print("="*80)
            print(f"Question:       {question}")
            print(f"Mechanism:      {mechanism} ({reason})")
            print(f"Final Answer:   {final_answer}")
            print(f"Quorum:         REACHED")
            print(f"Session ID:     {transcript_data['session_id']}")
            print(f"Transcript Hash:{transcript_data['hash']}")
            print(f"TX Signature:   {signature}")
            print(f"Verifiable at:  https://explorer.solana.com/tx/{signature}?cluster=devnet")
        except Exception as e:
            print(f"Failed to log to Solana: {str(e)}")
            
    else:
        print(f"\nBecause quorum was not reached, no transcript hash will be committed to the chain to save gas.")

if __name__ == "__main__":
    main()
