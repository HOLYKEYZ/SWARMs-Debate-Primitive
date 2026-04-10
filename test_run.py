import time
from core.vote import run_vote
from core.debate import run_debate
from core.selector import decide_mechanism
from chain.transcript import create_transcript
from chain.solana_client import SolanaClient

def print_result(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {name} {detail}")

def test_1():
    print("\n--- Test 1: Vote on simple factual question ---")
    try:
        q = "What is the boiling point of pure water in Kelvin at sea level?"
        res = run_vote(q, num_agents=3)
        # Should win with 100
        passed = "100" in res['winning_answer'] and res['quorum_reached']
        print_result("Vote factual question", passed, f"(Answers: {res['winning_answer']})")
        return passed
    except Exception as e:
        print_result("Vote factual question", False, f"Exception: {str(e)}")
        return False

def test_2():
    print("\n--- Test 2: Debate on complex ethical question ---")
    try:
        q = "Should artificial intelligence be granted legal personhood?"
        res = run_debate(q, num_agents=3, num_rounds=2)
        passed = type(res['final_answer']) == str and res['agent_count'] == 3
        print_result("Debate ethical question", passed, f"(Final: {res['final_answer'][:30]}...)")
        return passed
    except Exception as e:
        print_result("Debate ethical question", False, f"Exception: {str(e)}")
        return False

def test_3():
    print("\n--- Test 3: Hash + Solana write + verify round trip ---")
    try:
        res = create_transcript('vote', 'dummy reason', {"question": "test?", "winning_answer": "yes", "quorum_reached": True})
        client = SolanaClient()
        sig = client.log_hash_to_chain(res['session_id'], res['hash'])
        ver = client.verify_on_chain(sig)
        
        passed = ver['verified'] and res['hash'] in ver['memo']
        print_result("Solana devnet roundtrip", passed, f"(Sig: {sig[:20]}...)")
        return passed
    except Exception as e:
        print_result("Solana devnet roundtrip", False, f"Exception: {str(e)}")
        return False

def test_4():
    print("\n--- Test 4: Full End-to-End Pipeline ---")
    try:
        q = "Is Paris the capital of France?"
        mech, reason = decide_mechanism(q, num_agents=3)
        if mech == 'debate':
            session = run_debate(q, num_agents=3, num_rounds=2)
        else:
            session = run_vote(q, num_agents=3)
        
        ts = create_transcript(mech, reason, session)
        client = SolanaClient()
        sig = client.log_hash_to_chain(ts['session_id'], ts['hash'])
        ver = client.verify_on_chain(sig)
        
        passed = ver['verified']
        print_result("End-to-End Pipeline", passed, f"({mech} -> Solana {'Verified' if passed else 'Failed'})")
        return passed
    except Exception as e:
        print_result("End-to-End Pipeline", False, f"Exception: {str(e)}")
        return False

def run_all_tests():
    print("="*60)
    print(" STARTING TEST SUITE ")
    print("="*60)
    
    t1 = test_1()
    t2 = test_2()
    t3 = test_3()
    t4 = test_4()
    
    print("\n" + "="*60)
    print(" TEST SUMMARY ")
    print("="*60)
    print_result("Test 1: Vote", t1)
    print_result("Test 2: Debate", t2)
    print_result("Test 3: Solana Roundtrip", t3)
    print_result("Test 4: End-to-End", t4)

if __name__ == "__main__":
    run_all_tests()
