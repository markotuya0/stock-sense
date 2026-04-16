import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Integer, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .session import Base

# Utility to pick UUID type depending on dialect
def get_uuid_type():
    # We'll use the UUID type for Postgres, and String for others like SQLite in dev
    # However, for consistency we'll use UUID for models and cast it
    return UUID(as_uuid=True)

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    tier = Column(String, default="FREE")  # FREE, PRO, ENTERPRISE
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    telegram_chat_id = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    settings = Column(JSON, default={})

    searches = relationship("SearchHistory", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    token_hash = Column(String, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")

class Signal(Base):
    __tablename__ = "signals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String, index=True, nullable=False)
    name = Column(String)
    market = Column(String, index=True) # US, NGX
    signal_type = Column(String) # STRONG_BUY, BUY, etc.
    score = Column(Float)
    price_at_signal = Column(Float)
    price_target = Column(Float)
    risk_score = Column(Integer)
    analysis = Column(JSON) # Stores: reason, beginner_note, learn_term, learn_explanation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Layer 2 details (Optional, filled by deep research)
    is_layer2 = Column(Boolean, default=False)
    deep_research = Column(JSON, nullable=True)

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    query = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="searches")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    symbol = Column(String, nullable=False)
    target_price = Column(Float, nullable=False)
    condition = Column(String, default="GREATER_THAN") # GREATER_THAN, LESS_THAN
    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alerts")

class AccuracyRecord(Base):
    __tablename__ = "accuracy_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signal_id = Column(UUID(as_uuid=True), ForeignKey("signals.id"))
    symbol = Column(String, nullable=False)
    price_at_signal = Column(Float)
    price_current = Column(Float)
    accuracy_score = Column(Float)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    paystack_ref = Column(String, unique=True, index=True)
    amount = Column(Integer) # in kobo
    tier_selected = Column(String)
    status = Column(String, default="PENDING") # PENDING, SUCCESS, FAILED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
