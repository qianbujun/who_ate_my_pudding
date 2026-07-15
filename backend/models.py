from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255))
    
    sessions = relationship("GameSession", back_populates="user")

class GameSession(Base):
    __tablename__ = "game_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="playing") # playing, win_logic, win_guess, lose_guess
    current_ap = Column(Integer, default=)
    
    user = relationship("User", back_populates="sessions")
    actions = relationship("GameAction", back_populates="session")

class GameAction(Base):
    __tablename__ = "game_actions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"))
    action_type = Column(String(50)) # investigate, investigate_cctv, ask_fixed, ask_llm, guess, catch
    detail = Column(Text) # JSON string to store rich info like 'character', 'question', 'answer'
    ap_cost = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("GameSession", back_populates="actions")
