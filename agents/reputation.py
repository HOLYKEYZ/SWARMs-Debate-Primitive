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
    - Matches final consensus: + (confidence * 10)
    - Disagrees with consensus: - (confidence * 5)
    - No quorum: - 2 (penalty for failure to coordinate)
    """
    if not quorum_reached:
        return -2.0
    
    agent_ans = str(agent_answer).strip().lower()
    final_ans = str(final_answer).strip().lower()
    
    if agent_ans == final_ans:
        return round(float(confidence) * 10.0, 2)
    else:
        return round(-(float(confidence) * 5.0), 2)
