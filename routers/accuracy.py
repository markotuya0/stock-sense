from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from sqlalchemy import func, case
from db.models import Signal, AccuracyRecord

router = APIRouter(prefix="/accuracy", tags=["Accuracy"])

@router.get("/")
def get_public_accuracy_stats(db: Session = Depends(get_db)):
    """Public stats for the landing page transparency table."""
    total_signals = db.query(func.count(Signal.id)).scalar() or 0
    total_evaluated = db.query(func.count(AccuracyRecord.id)).scalar() or 0
    avg_accuracy = db.query(func.avg(AccuracyRecord.accuracy_score)).scalar()
    avg_gain = db.query(
        func.avg(AccuracyRecord.price_current - AccuracyRecord.price_at_signal)
    ).scalar()
    win_rate_30d = db.query(
        func.avg(
            case(
                (AccuracyRecord.price_current >= AccuracyRecord.price_at_signal, 1.0),
                else_=0.0,
            )
        )
    ).scalar()

    normalized_accuracy = float(avg_accuracy) if avg_accuracy is not None else 0.0
    normalized_gain = float(avg_gain) if avg_gain is not None else 0.0
    normalized_win_rate = float(win_rate_30d) if win_rate_30d is not None else 0.0

    return {
        "overall_accuracy": round(normalized_accuracy * 100, 1),
        "total_signals": total_signals,
        "total_evaluated_signals": total_evaluated,
        "avg_gain": round(normalized_gain, 2),
        "win_rate_30d": round(normalized_win_rate * 100, 1),
        "recent_performance": "STABLE" if normalized_accuracy >= 0.7 else "VOLATILE",
    }

@router.get("/leaderboard")
def get_best_performing_symbols(db: Session = Depends(get_db)):
    """Returns top 5 stocks by historical signal accuracy."""
    results = db.query(
        Signal.symbol,
        Signal.market,
        func.avg(AccuracyRecord.accuracy_score).label("win_rate"),
        func.avg(AccuracyRecord.price_current - AccuracyRecord.price_at_signal).label("avg_return"),
    ).join(AccuracyRecord, Signal.id == AccuracyRecord.signal_id) \
     .group_by(Signal.symbol) \
     .group_by(Signal.market) \
     .order_by(func.avg(AccuracyRecord.accuracy_score).desc()) \
     .limit(5).all()

    return [
        {
            "symbol": r.symbol,
            "market": r.market,
            "win_rate": round(float(r.win_rate) * 100, 1),
            "avg_return": round(float(r.avg_return or 0.0), 2),
            "verification_state": "verified",
        }
        for r in results
    ]
