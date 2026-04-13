from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db.session import get_db
from db.models import Signal, User
from middleware.auth import get_current_user
from middleware.tier_guard import require_pro
import structlog

log = structlog.get_logger()
router = APIRouter(prefix="/signals", tags=["signals"])

@router.get("/")
def get_signals(
    market: Optional[str] = Query(None, regex="^(US|NGX)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch latest stock signals. Tier-limited results logic applies here."""
    query = db.query(Signal)
    if market:
        query = query.filter(Signal.market == market)
    
    signals = query.order_by(Signal.created_at.desc()).limit(20).all()
    
    # Tier logic: FREE users only see limited data
    if current_user.tier == "FREE":
        for s in signals:
            # Mask sensitive data for free users if needed
            # s.analysis = {"reason": "Upgrade to Pro to see analysis"}
            pass
            
    return signals

@router.get("/{signal_id}")
def get_signal_detail(
    signal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro) # Only Pro can see deep details
):
    """Deep analysis for a specific signal (Pro Only)."""
    signal = db.query(Signal).filter(Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal
