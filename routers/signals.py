from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db.session import get_db
from db.models import Signal, User
from middleware.auth import get_current_user
from middleware.tier_guard import require_pro
import structlog
from datetime import datetime, timezone
from threading import Thread, Lock
import yfinance as yf
from db.session import SessionLocal

log = structlog.get_logger()
router = APIRouter(prefix="/signals", tags=["signals"])
_signal_jobs: dict[str, dict] = {}
_job_lock = Lock()


def _detect_market(symbol: str) -> str:
    return "NGX" if symbol.endswith(".LG") or symbol.endswith(".NG") else "US"


def _generate_realtime_signal(symbol: str) -> None:
    """Fetch live market snapshot and persist a verified signal row."""
    normalized = symbol.upper()
    db = SessionLocal()
    try:
        ticker = yf.Ticker(normalized)
        fast_info = getattr(ticker, "fast_info", {}) or {}
        info = getattr(ticker, "info", {}) or {}
        current_price = float(fast_info.get("lastPrice") or info.get("currentPrice") or 0.0)
        previous_close = float(
            fast_info.get("previousClose")
            or info.get("regularMarketPreviousClose")
            or current_price
            or 0.0
        )
        if current_price <= 0:
            raise ValueError(f"No live price available for {normalized}")

        move_pct = ((current_price - previous_close) / previous_close) * 100 if previous_close > 0 else 0.0
        if move_pct >= 2:
            verdict = "BUY"
            score = 7.5
        elif move_pct <= -2:
            verdict = "SELL"
            score = 3.5
        else:
            verdict = "HOLD"
            score = 5.5

        signal = Signal(
            symbol=normalized,
            name=info.get("shortName") or normalized,
            market=_detect_market(normalized),
            signal_type=verdict,
            score=score,
            price_at_signal=current_price,
            price_target=round(current_price * (1.05 if verdict == "BUY" else 0.95 if verdict == "SELL" else 1.0), 2),
            risk_score=4 if verdict == "HOLD" else 6,
            analysis={
                "reason": f"Real-time market move {move_pct:.2f}% from previous close.",
                "beginner_note": "This signal was generated from a live market snapshot.",
                "learn_term": "Momentum",
                "learn_explanation": "Momentum compares current price movement versus previous close.",
            },
            is_layer2=False,
            deep_research={
                "status": "verified",
                "source": "realtime-yfinance",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "move_pct": round(move_pct, 2),
            },
        )
        db.add(signal)
        db.commit()
        with _job_lock:
            _signal_jobs[normalized] = {"status": "verified", "updated_at": datetime.now(timezone.utc).isoformat()}
    except Exception as exc:
        log.error("Realtime signal generation failed", symbol=normalized, error=str(exc))
        with _job_lock:
            _signal_jobs[normalized] = {
                "status": "failed",
                "error": str(exc),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
    finally:
        db.close()


def _enqueue_signal_fetch(symbol: str) -> None:
    normalized = symbol.upper()
    with _job_lock:
        job = _signal_jobs.get(normalized)
        if job and job.get("status") in {"fetching", "verified"}:
            return
        _signal_jobs[normalized] = {"status": "fetching", "updated_at": datetime.now(timezone.utc).isoformat()}
    Thread(target=_generate_realtime_signal, args=(normalized,), daemon=True).start()

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
@router.get("/symbol/{symbol}")
def get_signal_by_symbol(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch latest verified signal, or trigger real-time fetch if missing."""
    normalized = symbol.upper()
    signal = db.query(Signal).filter(Signal.symbol == normalized).order_by(Signal.created_at.desc()).first()
    if not signal:
        _enqueue_signal_fetch(normalized)
        return {
            "symbol": normalized,
            "status": "fetching",
            "verified": False,
            "message": f"Fetching real-time verified analysis for {normalized}",
        }

    return {
        **{c.name: getattr(signal, c.name) for c in Signal.__table__.columns},
        "status": "verified",
        "verified": True,
        "verified_at": signal.created_at.isoformat() if signal.created_at else None,
    }


@router.get("/symbol/{symbol}/status")
def get_signal_status(symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    normalized = symbol.upper()
    signal = db.query(Signal).filter(Signal.symbol == normalized).order_by(Signal.created_at.desc()).first()
    if signal:
        return {"symbol": normalized, "status": "verified", "verified": True}
    with _job_lock:
        job = _signal_jobs.get(normalized, {"status": "idle"})
    return {"symbol": normalized, "status": job.get("status", "idle"), "error": job.get("error")}
