from sqlalchemy.orm import Session
from server.database import SessionLocal, AgentReputation
from datetime import datetime, timezone

# Default agents
DEFAULT_AGENTS = [
    {"name": "Agent_1_Analyst", "persona": "Analyst"},
    {"name": "Agent_2_Critic", "persona": "Critic"},
    {"name": "Agent_3_Advocate", "persona": "Advocate"},
    {"name": "Agent_4_Skeptic", "persona": "Skeptic"},
]

def init_agent_reputation():
    """Initialize default agents in the reputation system."""
    db = SessionLocal()
    try:
        for agent in DEFAULT_AGENTS:
            existing = db.query(AgentReputation).filter(AgentReputation.agent_name == agent["name"]).first()
            if not existing:
                new_agent = AgentReputation(
                    id=agent["name"],
                    agent_name=agent["name"],
                    persona=agent["persona"],
                    reputation_score=0.0,
                    sessions_participated=0,
                    correct_predictions=0,
                    position_changes=0,
                )
                db.add(new_agent)
        db.commit()
    finally:
        db.close()

def update_agent_reputation(agent_name: str, delta: float, correct: bool = False, position_changed: bool = False):
    """Update agent reputation after a session."""
    db = SessionLocal()
    try:
        agent = db.query(AgentReputation).filter(AgentReputation.agent_name == agent_name).first()
        if agent:
            agent.reputation_score += delta
            agent.sessions_participated += 1
            if correct:
                agent.correct_predictions += 1
            if position_changed:
                agent.position_changes += 1
            agent.updated_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()

def get_agent_reputation(agent_name: str = None):
    """Get reputation for a specific agent or all agents."""
    db = SessionLocal()
    try:
        if agent_name:
            agent = db.query(AgentReputation).filter(AgentReputation.agent_name == agent_name).first()
            return agent
        return db.query(AgentReputation).order_by(AgentReputation.reputation_score.desc()).all()
    finally:
        db.close()

def get_leaderboard():
    """Get agent leaderboard sorted by reputation."""
    db = SessionLocal()
    try:
        return db.query(AgentReputation).order_by(AgentReputation.reputation_score.desc()).all()
    finally:
        db.close()
