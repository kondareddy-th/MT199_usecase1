import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Get database URL from environment variable or use SQLite as default
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./mt_navigator.db")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Create dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String(50), index=True)
    message_type = Column(String(10), index=True)  # MT or MX
    content = Column(Text)
    converted_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processing_time = Column(Float, nullable=True)  # In seconds
    is_bulk = Column(Boolean, default=False)
    
    attributes = relationship("MessageAttribute", back_populates="message", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="message", cascade="all, delete-orphan")
    
class MessageAttribute(Base):
    __tablename__ = "message_attributes"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    key = Column(String(100))
    value = Column(Text)
    
    message = relationship("Message", back_populates="attributes")

class UserSetting(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    api_key = Column(String(255), nullable=True)
    model = Column(String(100), default="gpt-4o")
    default_mode = Column(String(20), default="convert")  # convert or extract
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(50), unique=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    status = Column(String(20), index=True)  # open, in_progress, resolved, closed
    priority = Column(String(20), index=True)  # low, medium, high, critical
    customer_info = Column(Text, nullable=True)  # JSON with customer information
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    message = relationship("Message", back_populates="investigations")
    actions = relationship("InvestigationAction", back_populates="investigation", cascade="all, delete-orphan")
    
class InvestigationAction(Base):
    __tablename__ = "investigation_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"))
    action_type = Column(String(50))  # information_request, amendment_request, customer_notification, etc.
    description = Column(Text)
    suggested_response = Column(Text, nullable=True)
    status = Column(String(20), index=True)  # pending, in_progress, completed, cancelled
    priority = Column(String(20))  # low, medium, high, critical
    notes = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    investigation = relationship("Investigation", back_populates="actions")