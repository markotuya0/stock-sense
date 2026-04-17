from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db.session import get_db
from db.models import Signal, SignalJob, MarketSnapshot
from middleware.auth import get_current_user
from middleware.tier_guard import require_pro
import structlog
from datetime import datetime, timezone
from threading import Thread
import yfinance as yf
from db.session import SessionLocal

log = structlog.get_logger()
router = APIRouter(prefix="/signals", tags=["signals"])


def _detect_market(symbol: str) -> str:
    return "NGX" if symbol.endswith(".LG") or symbol.endswith(".NG") else "US"


def _build_verification_payload(signal: Signal, db: Session) -> dict:
    snapshot = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == signal.symbol)
        .order_by(MarketSnapshot.as_of.desc())
        .first()
    )
    data_source = snapshot.source if snapshot else "SIGNALS_DB"
    verified_at = signal.created_at.isoformat() if signal.created_at else None
    return {
        "verification_state": "verified",
        "verified_at": verified_at,
        "data_source": data_source,
        "confidence": snapshot.confidence if snapshot else "MEDIUM",
    }


def _set_job_state(
    db: Session,
    symbol: str,
    status: str,
    market: str,
    error_message: Optional[str] = None,
    progress: int = 0,
    result_signal_id=None,
) -> SignalJob:
    job = (
        db.query(SignalJob)
        .filter(SignalJob.symbol == symbol, SignalJob.job_type == "SIGNAL_VERIFY")
        .order_by(SignalJob.created_at.desc())
        .first()
    )
    now = datetime.now(timezone.utc)
    if not job:
        job = SignalJob(symbol=symbol, market=market, job_type="SIGNAL_VERIFY", status=status)
        db.add(job)

    job.status = status
    job.progress = progress
    job.error_message = error_message
    job.updated_at = now
    if status == "RUNNING" and not job.started_at:
        job.started_at = now
    if status in {"VERIFIED", "FAILED"}:
        job.finished_at = now
    if result_signal_id:
        job.result_signal_id = result_signal_id
    db.commit()
    db.refresh(job)
    return job


def _generate_realtime_signal(symbol: str, market: str) -> None:
    """Fetch live market snapshot and persist a verified signal row."""
    normalized = symbol.upper()
    db = SessionLocal()
    try:
        _set_job_state(db, normalized, status="RUNNING", market=market, progress=20)
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
        db.flush()
        snapshot = MarketSnapshot(
            symbol=normalized,
            market=market,
            price=current_price,
            previous_close=previous_close,
            move_pct=round(move_pct, 4),
            volume=float(fast_info.get("lastVolume", 0) or 0),
            as_of=datetime.now(timezone.utc),
            source="YFINANCE_REALTIME",
            confidence="MEDIUM" if market == "NGX" else "HIGH",
            raw_payload={"fast_info": fast_info, "info": {"shortName": info.get("shortName")}},
        )
        db.add(snapshot)
        db.commit()
        _set_job_state(
            db,
            normalized,
            status="VERIFIED",
            market=market,
            progress=100,
            result_signal_id=signal.id,
        )
    except Exception as exc:
        log.error("Realtime signal generation failed", symbol=normalized, error=str(exc))
        db.rollback()
        _set_job_state(db, normalized, status="FAILED", market=market, error_message=str(exc), progress=100)
    finally:
        db.close()


def _enqueue_signal_fetch(symbol: str, market: str, db: Session) -> None:
    normalized = symbol.upper()
    existing = (
        db.query(SignalJob)
        .filter(
            SignalJob.symbol == normalized,
            SignalJob.job_type == "SIGNAL_VERIFY",
            SignalJob.status.in_(["QUEUED", "RUNNING"]),
        )
        .order_by(SignalJob.created_at.desc())
        .first()
    )
    if existing:
        return

    _set_job_state(db, normalized, status="QUEUED", market=market, progress=0)
    Thread(target=_generate_realtime_signal, args=(normalized, market), daemon=True).start()


@router.get("/")
def get_signals(
    market: Optional[str] = Query(None, regex="^(US|NGX)$"),
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    """Fetch latest stock signals. Tier-limited results logic applies here."""
    query = db.query(Signal)
    if market:
        query = query.filter(Signal.market == market)

    signals = query.order_by(Signal.created_at.desc()).limit(20).all()

    # Tier logic: FREE users only see limited data
    if supabase_user.get("tier") == "FREE":
        for s in signals:
            # Mask sensitive data for free users if needed
            # s.analysis = {"reason": "Upgrade to Pro to see analysis"}
            pass

    payload = []
    for signal in signals:
        row = {c.name: getattr(signal, c.name) for c in Signal.__table__.columns}
        row.update(_build_verification_payload(signal, db))
        payload.append(row)
    return payload


@router.get("/{signal_id}")
def get_signal_detail(
    signal_id: str,
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(require_pro)  # Only Pro can see deep details
):
    """Deep analysis for a specific signal (Pro Only)."""
    signal = db.query(Signal).filter(Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    row = {c.name: getattr(signal, c.name) for c in Signal.__table__.columns}
    row.update(_build_verification_payload(signal, db))
    return row


@router.get("/symbol/{symbol}")
def get_signal_by_symbol(
    symbol: str,
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    """Fetch latest verified signal, or trigger real-time fetch if missing."""
    normalized = symbol.upper()
    market = _detect_market(normalized)
    signal = db.query(Signal).filter(Signal.symbol == normalized).order_by(Signal.created_at.desc()).first()
    if not signal:
        _enqueue_signal_fetch(normalized, market, db)
        job = (
            db.query(SignalJob)
            .filter(SignalJob.symbol == normalized, SignalJob.job_type == "SIGNAL_VERIFY")
            .order_by(SignalJob.created_at.desc())
            .first()
        )
        return {
            "symbol": normalized,
            "status": "fetching",
            "verified": False,
            "job_id": str(job.id) if job else None,
            "verification_state": "fetching",
            "verified_at": None,
            "data_source": "REALTIME_QUEUE",
            "message": f"Fetching real-time verified analysis for {normalized}",
        }

    return {
        **{c.name: getattr(signal, c.name) for c in Signal.__table__.columns},
        "status": "verified",
        "verified": True,
        "verified_at": signal.created_at.isoformat() if signal.created_at else None,
        "verification_state": "verified",
        "data_source": (
            db.query(MarketSnapshot.source)
            .filter(MarketSnapshot.symbol == signal.symbol)
            .order_by(MarketSnapshot.as_of.desc())
            .limit(1)
            .scalar()
            or "SIGNALS_DB"
        ),
    }


@router.get("/symbol/{symbol}/status")
def get_signal_status(
    symbol: str,
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    normalized = symbol.upper()
    signal = db.query(Signal).filter(Signal.symbol == normalized).order_by(Signal.created_at.desc()).first()
    if signal:
        return {"symbol": normalized, "status": "verified", "verified": True}
    job = (
        db.query(SignalJob)
        .filter(SignalJob.symbol == normalized, SignalJob.job_type == "SIGNAL_VERIFY")
        .order_by(SignalJob.created_at.desc())
        .first()
    )
    if not job:
        return {"symbol": normalized, "status": "idle", "error": None}
    return {
        "symbol": normalized,
        "status": job.status.lower(),
        "progress": job.progress,
        "error": job.error_message,
        "job_id": str(job.id),
    }
