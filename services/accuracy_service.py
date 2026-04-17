import structlog
from datetime import datetime, timedelta, timezone
import yfinance as yf
from sqlalchemy.orm import Session
from db.models import Signal, AccuracyRecord
from db.session import SessionLocal
import asyncio

log = structlog.get_logger()

async def calculate_accuracy(price_at_signal: float, price_current: float, signal_type: str) -> float:
    """
    Calculate accuracy score based on signal type and price movement.
    Range: 0.0 (completely wrong) to 1.0 (perfectly correct).
    """
    if price_at_signal <= 0:
        return 0.5  # Unknown

    price_change_pct = ((price_current - price_at_signal) / price_at_signal) * 100

    if signal_type == "BUY":
        # BUY signal should result in positive price movement
        if price_change_pct > 5:
            return 1.0  # Excellent
        elif price_change_pct > 0:
            return 0.75  # Good
        elif price_change_pct > -5:
            return 0.5  # Neutral
        else:
            return 0.25  # Poor
    elif signal_type == "SELL":
        # SELL signal should result in negative price movement (protection)
        if price_change_pct < -5:
            return 1.0  # Excellent
        elif price_change_pct < 0:
            return 0.75  # Good
        elif price_change_pct < 5:
            return 0.5  # Neutral
        else:
            return 0.25  # Poor
    else:  # HOLD
        # HOLD signal should result in minimal movement
        if abs(price_change_pct) < 2:
            return 1.0  # Excellent
        elif abs(price_change_pct) < 5:
            return 0.75  # Good
        else:
            return 0.5  # Neutral

async def populate_accuracy_records(db: Session = None):
    """Populate accuracy records for signals older than 3 days without accuracy data."""
    if db is None:
        db = SessionLocal()
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=3)

        # Find signals without accuracy records yet
        signals = (
            db.query(Signal)
            .filter(Signal.created_at < cutoff_date)
            .filter(~Signal.id.in_(
                db.query(AccuracyRecord.signal_id)
            ))
            .limit(100)
            .all()
        )

        for signal in signals:
            try:
                # Fetch current price
                ticker = yf.Ticker(signal.symbol)
                fast_info = getattr(ticker, "fast_info", {}) or {}
                info = getattr(ticker, "info", {}) or {}
                price_current = float(fast_info.get("lastPrice") or info.get("currentPrice") or 0.0)

                if price_current <= 0:
                    log.warning("Could not fetch current price", symbol=signal.symbol)
                    continue

                accuracy_score = await calculate_accuracy(
                    signal.price_at_signal,
                    price_current,
                    signal.signal_type
                )

                record = AccuracyRecord(
                    signal_id=signal.id,
                    symbol=signal.symbol,
                    price_at_signal=signal.price_at_signal,
                    price_current=price_current,
                    accuracy_score=accuracy_score,
                )
                db.add(record)
                log.info("Created accuracy record", symbol=signal.symbol, accuracy=accuracy_score)

            except Exception as e:
                log.warning("Failed to calculate accuracy for signal", signal_id=str(signal.id), error=str(e))
                continue

        db.commit()
        log.info("Accuracy records population complete", count=len(signals))
    except Exception as e:
        log.error("Accuracy records population failed", error=str(e))
        db.rollback()
    finally:
        db.close()
