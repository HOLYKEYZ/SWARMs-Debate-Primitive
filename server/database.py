import os
from sqlalchemy import create_engine, Column, String, Float, Boolean, Text, DateTime, JSON, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

Base = declarative_base()

class SessionModel(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)
    question = Column(Text, nullable=False)
    user_pubkey = Column(String, nullable=True)
    status = Column(String, default="pending")
    mechanism = Column(String, nullable=True)
    selector_result = Column(JSON, nullable=True)
    session_data = Column(JSON, nullable=True)
    transcript_hash = Column(String, nullable=True)
    chain_signature = Column(String, nullable=True)
    chain_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AgentReputation(Base):
    __tablename__ = "agent_reputation"
    
    id = Column(String, primary_key=True)
    agent_name = Column(String, nullable=False, unique=True)
    persona = Column(String, nullable=False)
    reputation_score = Column(Float, default=100.0)
    sessions_participated = Column(Integer, default=0)
    correct_predictions = Column(Integer, default=0)
    position_changes = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# database setup
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "swarms.db")
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
