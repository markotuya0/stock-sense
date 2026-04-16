from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User
from services.auth_service import get_current_user
from typing import List

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/")
def get_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns the user's current holdings and P&L."""
    return {
        "total_value_usd": 12500.50,
        "daily_change_pct": 1.2,
        "holdings": [
            {"symbol": "NVDA", "shares": 10, "avg_price": 95.0, "current_price": 125.0, "gain": 30.0},
            {"symbol": "ZENITHB", "shares": 5000, "avg_price": 38.5, "current_price": 42.0, "gain": 9.1}
        ]
    }
