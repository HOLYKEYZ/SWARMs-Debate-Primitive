import os
import json
import asyncio
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, constr
from sse_starlette.sse import EventSourceResponse

from server.session_manager import SessionManager
from chain.solana_client import SolanaClient
from server.database import init_db
from server.agent_reputation import init_agent_reputation, get_leaderboard
from agents.reputation import compute_reputation_delta
import config

# rate limiter config
RATE_LIMIT_REQUESTS = 60
RATE_LIMIT_WINDOW = 60
rate_limit_store = defaultdict(list)

# allowed origins from env, comma separated. localhost dev defaults included.
_default_origins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4000,http://127.0.0.1:4000"
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",") if o.strip()]


def check_rate_limit(client_ip: str) -> bool:
    """check if client has exceeded rate limit."""
    now = time.time()
    rate_limit_store[client_ip] = [
        timestamp for timestamp in rate_limit_store[client_ip]
        if now - timestamp < RATE_LIMIT_WINDOW
    ]
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        return False
    rate_limit_store[client_ip].append(now)
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """initialize database and agent reputation on startup."""
    init_db()
    init_agent_reputation()
    yield


app = FastAPI(
    title="SWARMs Debate Primitive",
    description="Multi-agent AI coordination with on-chain verification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# shared session manager instance
manager = SessionManager()


class SubmitRequest(BaseModel):
    question: constr(min_length=10, max_length=10000)
    user_pubkey: str | None = None
    rounds: int = 3
    quorum_threshold: float = 0.75

    @field_validator('rounds')
    @classmethod
    def validate_rounds(cls, v):
        if v < 1 or v > 10:
            raise ValueError('rounds must be between 1 and 10')
        return v

    @field_validator('quorum_threshold')
    @classmethod
    def validate_quorum_threshold(cls, v):
        if v < 0.51 or v > 1.0:
            raise ValueError('quorum_threshold must be between 0.51 and 1.0')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "question": "Should we deploy this smart contract?",
                "rounds": 3,
                "quorum_threshold": 0.75
            }
        }


class SubmitResponse(BaseModel):
    session_id: str
    status: str
    message: str


@app.post("/api/session", response_model=SubmitResponse)
async def submit_session(req: SubmitRequest, http_request: Request):
    """submit a new question to the swarm. returns session_id for streaming."""
    client_ip = http_request.client.host if http_request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")
    
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    session = manager.create_session(
        req.question.strip(), 
        req.user_pubkey,
        rounds=req.rounds,
        quorum_threshold=req.quorum_threshold
    )

    # start the pipeline in the background
    asyncio.create_task(manager.run_session(session))

    return SubmitResponse(
        session_id=session.session_id,
        status="pending",
        message="Session created. Connect to /api/session/{id}/stream for live updates."
    )


@app.get("/api/session/{session_id}/stream")
async def stream_session(session_id: str):
    """sse endpoint streaming real-time events for a session."""
    session = manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    async def event_generator():
        # first, replay any events that already happened (for late joiners)
        for event in session.events:
            yield {
                "event": event.event_type,
                "data": json.dumps(event.to_dict())
            }

        # then stream new events live
        while session.status not in ("complete", "failed"):
            try:
                event = await asyncio.wait_for(session.event_queue.get(), timeout=30.0)
                yield {
                    "event": event.event_type,
                    "data": json.dumps(event.to_dict())
                }
            except asyncio.TimeoutError:
                # send heartbeat to keep connection alive
                yield {"event": "heartbeat", "data": json.dumps({"status": "alive"})}

        # drain any remaining events in the queue
        while not session.event_queue.empty():
            event = session.event_queue.get_nowait()
            yield {
                "event": event.event_type,
                "data": json.dumps(event.to_dict())
            }

    return EventSourceResponse(event_generator())


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """get the current state of a session."""
    session = manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="session not found")
    return session.to_dict()


@app.get("/api/sessions")
async def list_sessions(limit: int = 20):
    """list recent sessions."""
    return manager.list_sessions(limit)


@app.get("/api/agents")
async def list_agents():
    """list agent reputation statistics."""
    registry_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agents", "registry.json")
    try:
        with open(registry_path, 'r') as f:
            data = json.load(f)

        agents_data = []
        for persona, agent_id in data.get("agents", {}).items():
            # Compute reputation from all completed sessions
            total_rep = 0.0 # start at 0
            sessions_count = 0

            for session in manager.sessions.values():
                if session.session_data and session.status == "complete":
                    final_answer = session.session_data.get("final_answer", "")
                    quorum_reached = session.session_data.get("quorum_reached", False)
                    rounds = session.session_data.get("rounds", [])

                    if rounds:
                        final_round = rounds[-1]
                        for resp in final_round.get("responses", []):
                            if resp.get("persona") == persona:
                                answer = resp.get("response", {}).get("answer", "")
                                confidence = resp.get("response", {}).get("confidence", 0.0)
                                delta = compute_reputation_delta(answer, final_answer, confidence, quorum_reached)
                                total_rep += delta
                                sessions_count += 1

            agents_data.append({
                "persona": persona,
                "agent_id": agent_id,
                "reputation_score": round(total_rep, 2),
                "sessions_participated": sessions_count
            })

        return sorted(agents_data, key=lambda x: x["reputation_score"], reverse=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/verify/{signature}")
async def verify_signature(signature: str):
    """verify an on-chain transaction."""
    try:
        client = SolanaClient()
        result = await asyncio.to_thread(client.verify_on_chain, signature)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """basic service probe for deployment platforms."""
    return {
        "status": "ok",
        "service": "swarms-debate-primitive",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health():
    """health check endpoint. verifies database connectivity and api key presence."""
    db_ok = False
    try:
        from server.database import SessionLocal, SessionModel
        db = SessionLocal()
        try:
            db.query(SessionModel).limit(1).all()
            db_ok = True
        finally:
            db.close()
    except Exception:
        db_ok = False

    return {
        "status": "ok" if db_ok and bool(config.API_KEYS) else "degraded",
        "service": "swarms-debate-primitive",
        "version": app.version,
        "database": "connected" if db_ok else "unavailable",
        "api_keys_configured": len(config.API_KEYS),
        "active_sessions": len(manager.sessions),
    }
