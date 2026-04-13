from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db.models import User, SearchHistory
from middleware.auth import get_current_user
import structlog

log = structlog.get_logger()
router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
def search_stock(
    q: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Universal stock search. Logs history and returns suggestions."""
    log.info("Stock search", query=q, user_id=current_user.id)
    
    # Save to history
    history = SearchHistory(user_id=current_user.id, query=q)
    db.add(history)
    db.commit()
    
    # In production, this would hit a global ticker database or yfinance
    # For now, return a mock suggestion
    return [
        {"symbol": "AAPL", "name": "Apple Inc.", "market": "US"},
        {"symbol": "ZENITHB", "name": "Zenith Bank Plc", "market": "NGX"},
    ]
