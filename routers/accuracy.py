from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import Signal, accuracy_records
from typing import List
from uuid import UUID

router = APIRouter(prefix="/accuracy", tags=["Accuracy"])

from sqlalchemy import func

@router.get("/")
def get_public_accuracy_stats(db: Session = Depends(get_db)):
    """Public stats for the landing page transparency table."""
    total_signals = db.query(func.count(Signal.id)).scalar() or 0
    avg_accuracy = db.query(func.avg(accuracy_records.c.accuracy_score)).scalar() or 0.75
    
    return {
        "overall_accuracy": round(float(avg_accuracy) * 100, 1),
        "total_signals": total_signals,
        "recent_performance": "STABLE" if avg_accuracy > 0.7 else "VOLATILE"
    }

@router.get("/leaderboard")
def get_best_performing_symbols(db: Session = Depends(get_db)):
    """Returns top 5 stocks by historical signal accuracy."""
    # Group by symbol and calculate average accuracy
    results = db.query(
        Signal.symbol,
        func.avg(accuracy_records.c.accuracy_score).label("win_rate")
    ).join(accuracy_records, Signal.id == accuracy_records.c.signal_id) \
     .group_by(Signal.symbol) \
     .order_by(func.avg(accuracy_records.c.accuracy_score).desc()) \
     .limit(5).all()
    
    return [
        {"symbol": r.symbol, "win_rate": round(float(r.win_rate) * 100, 1)} 
        for r in results
    ]
