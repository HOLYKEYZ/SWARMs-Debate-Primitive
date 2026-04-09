import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from server.session_manager import SessionManager
from chain.solana_client import SolanaClient

app = FastAPI(
    title="SWARMs Debate Primitive",
    description="Multi-agent AI coordination with on-chain verification",
    version="1.0.0"
)

# cors — allow frontend dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# shared session manager instance
manager = SessionManager()


class SubmitRequest(BaseModel):
    question: str
    user_pubkey: str | None = None


class SubmitResponse(BaseModel):
    session_id: str
    status: str
    message: str


@app.post("/api/session", response_model=SubmitResponse)
async def submit_session(req: SubmitRequest):
    """submit a new question to the swarm. returns session_id for streaming."""
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    session = manager.create_session(req.question.strip(), req.user_pubkey)

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


@app.get("/api/verify/{signature}")
async def verify_signature(signature: str):
    """verify an on-chain transaction."""
    try:
        client = SolanaClient()
        result = await asyncio.to_thread(client.verify_on_chain, signature)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "swarms-debate-primitive"}
