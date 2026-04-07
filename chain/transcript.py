import json
import hashlib
import uuid
from datetime import datetime, timezone

def create_transcript(mechanism: str, selector_reason: str, session_data: dict) -> dict:
    """
    Serialize full session to JSON, hash the string, and return metadata.
    
    Format requested:
    {
        session_id: uuid,
        timestamp: ISO8601,
        question: str,
        mechanism: "debate"|"vote",
        selector_reason: str,
        rounds: [...],
        final_answer: str,
        quorum_reached: bool,
        agent_count: int
    }
    
    Returns:
        dict: {"hash": str, "transcript_json": str, "session_id": str}
    """
    session_id = str(uuid.uuid4())
    
    # "rounds" for debate, or just wrap "responses" in a single round representation for vote
    rounds_data = session_data.get("rounds")
    if rounds_data is None:
        rounds_data = [{"round": 0, "responses": session_data.get("responses", [])}]
        
    final_answer = session_data.get("final_answer", session_data.get("winning_answer", ""))

    transcript_obj = {
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "question": session_data.get("question", ""),
        "mechanism": mechanism,
        "selector_reason": selector_reason,
        "rounds": rounds_data,
        "final_answer": final_answer,
        "quorum_reached": session_data.get("quorum_reached", False),
        "agent_count": session_data.get("agent_count", 0)
    }

    transcript_json = json.dumps(transcript_obj, separators=(',', ':'))
    
    # SHA256 hash the full JSON string
    hash_obj = hashlib.sha256(transcript_json.encode('utf-8'))
    transcript_hash = hash_obj.hexdigest()
    
    return {
        "hash": transcript_hash,
        "transcript_json": transcript_json,
        "session_id": session_id
    }
