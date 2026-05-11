import json
import os

REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "registry.json")

def get_agent_id(persona_type: str) -> str:
    """Fetch the persistent UUID for an agent persona."""
    try:
        with open(REGISTRY_PATH, 'r') as f:
            data = json.load(f)
            return data["agents"].get(persona_type, "")
    except Exception:
        return ""

def compute_reputation_delta(agent_answer: str, final_answer: str, confidence: float, quorum_reached: bool) -> float:
    """
    Calculate the reputation delta for a single session.
    - Matches final consensus: + (confidence * 10) - bonus for alignment
    - Disagrees with consensus: + (confidence * 3) - still rewarded for thoughtful participation
    - No quorum: + 1 - base participation reward
    
    Philosophy: All agents contribute value through diverse perspectives.
    Disagreement is not failure - it's part of healthy deliberation.
    """
    if not quorum_reached:
        return 1.0  # base participation reward
    
    agent_ans = str(agent_answer).strip().lower()
    final_ans = str(final_answer).strip().lower()
    
    if agent_ans == final_ans:
        return round(float(confidence) * 10.0, 2)  # consensus bonus
    else:
        return round(float(confidence) * 3.0, 2)  # participation reward
