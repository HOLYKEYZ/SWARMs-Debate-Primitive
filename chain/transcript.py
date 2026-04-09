import json
import hashlib
import uuid
from datetime import datetime, timezone
from agents.reputation import get_agent_id, compute_reputation_delta

def create_transcript(mechanism: str, selector_reason: str, session_data: dict) -> dict:
    """
    Serialize full session to JSON, hash the string, and return metadata.
    Includes agent reputation tracking.
    """
    session_id = str(uuid.uuid4())
    
    rounds_data = session_data.get("rounds")
    if rounds_data is None:
        rounds_data = [{"round": 0, "responses": session_data.get("responses", [])}]
        
    final_answer = session_data.get("final_answer", session_data.get("winning_answer", ""))
    quorum_reached = session_data.get("quorum_reached", False)

    # Inject reputation deltas into the final round responses
    final_round = rounds_data[-1]["responses"] if rounds_data else []
    for resp in final_round:
        persona = resp.get("persona", "")
        agent_id = get_agent_id(persona)
        ans = resp.get("response", {}).get("answer", "")
        conf = resp.get("response", {}).get("confidence", 0.0)
        
        delta = compute_reputation_delta(ans, final_answer, conf, quorum_reached)
        
        resp["agent_id"] = agent_id
        resp["reputation_delta"] = delta

    transcript_obj = {
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "question": session_data.get("question", ""),
        "mechanism": mechanism,
        "selector_reason": selector_reason,
        "rounds": rounds_data,
        "final_answer": final_answer,
        "quorum_reached": quorum_reached,
        "agent_count": session_data.get("agent_count", 0)
    }

    transcript_json = json.dumps(transcript_obj, separators=(',', ':'))
    hash_obj = hashlib.sha256(transcript_json.encode('utf-8'))
    transcript_hash = hash_obj.hexdigest()
    
    return {
        "hash": transcript_hash,
        "transcript_json": transcript_json,
        "session_id": session_id
    }
