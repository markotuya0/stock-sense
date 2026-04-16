import asyncio
import os
import argparse
import structlog
from datetime import datetime
from typing import List, Dict, Any, Optional

from config import settings
from scanner.us_scanner import USScanner
from scanner.ngx_scanner import NGXScanner
from scanner.daily_analyst import DailyAnalyst, Layer1Signal
from services.telegram_service import TelegramService

# Configure logging
structlog.configure(
    processors=[
        structlog.processors.JSONRenderer()
    ]
)
log = structlog.get_logger()

async def run_daily_scan(market: Optional[str] = None, dry_run: bool = False):
    """
    Main orchestration function for the Layer 1 scanner.
    """
    log.info("Starting daily market scan", market=market or "ALL", dry_run=dry_run)
    
    # 1. Initialize Scanners
    us_scanner = USScanner()
    ngx_scanner = NGXScanner()
    analyst = DailyAnalyst()
    telegram = TelegramService()

    # 2. Run Scans
    us_candidates = []
    ngx_candidates = []

    if market in [None, "US"]:
        log.info("Step 1a: Fetching US market candidates")
        us_candidates = us_scanner.scan()
    
    if market in [None, "NGX"]:
        log.info("Step 1b: Fetching NGX market candidates")
        ngx_candidates = ngx_scanner.scan()
    
    all_candidates = us_candidates + ngx_candidates
    log.info("Total candidates identified", count=len(all_candidates))
    
    if not all_candidates:
        log.info("No candidates passed pre-filters today. Sending empty briefing message.")
        if not dry_run:
            telegram.send_briefing([])
        return

    # 3. AI Analysis
    log.info("Step 2: Running AI analysis")
    if dry_run:
        log.info("Dry run enabled: generating non-persistent test signals only")
        signals = [
            Layer1Signal(
                symbol=c["symbol"],
                signal="BUY",
                score=7.0,
                price_target=c["price"] * 1.1,
                risk_score=5,
                reason="Dry-run analysis output (not persisted).",
                beginner_note="Dry-run output only.",
                learn_term="Dry Run",
                learn_explanation="A test run where no real actions are taken."
            ) for c in all_candidates[:3]
        ]
    else:
        signals = await analyst.analyze_all(all_candidates)
    
    log.info("Analysis complete", signals_generated=len(signals))

    if not dry_run:
        # 4. Save to Database
        log.info("Step 3: Persisting signals to database")
        from db.session import SessionLocal
        from db.models import Signal

        db = SessionLocal()
        try:
            for s in signals:
                new_db_signal = Signal(
                    symbol=s.symbol,
                    name=next((c["name"] for c in all_candidates if c["symbol"] == s.symbol), s.symbol),
                    market="US" if any(c["symbol"] == s.symbol and c["market"] == "US" for c in all_candidates) else "NGX",
                    signal_type=s.signal,
                    score=s.score,
                    price_at_signal=s.price_target / 1.1,
                    price_target=s.price_target,
                    risk_score=s.risk_score,
                    analysis={
                        "reason": s.reason,
                        "beginner_note": s.beginner_note,
                        "learn_term": s.learn_term,
                        "learn_explanation": s.learn_explanation
                    }
                )
                db.add(new_db_signal)
            db.commit()
            log.info("Database persistence complete", signals_saved=len(signals))
        except Exception as e:
            log.error("Database persistence failed", error=str(e))
            db.rollback()
        finally:
            db.close()
    else:
        log.info("Dry run: skipping database persistence")

    # 5. Send Telegram Briefing
    log.info("Step 4: Sending Telegram briefing")
    if not dry_run:
        success = telegram.send_briefing(signals)
        if success:
            log.info("Daily scan completed and briefing sent")
        else:
            log.error("Daily scan completed but briefing failed to send")
    else:
        briefing_text = telegram._format_briefing(signals)
        print("\n--- DRY RUN BRIEFING ---\n")
        print(briefing_text)
        print("\n--- END DRY RUN ---\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="StockSense Layer 1 Scanner")
    parser.add_argument("--market", type=str, choices=["US", "NGX"], help="Specific market to scan")
    parser.add_argument("--dry-run", action="store_true", help="Run without calling AI or Telegram")
    
    args = parser.parse_args()
    
    # Check for DRY_RUN environment variable or flag
    is_dry_run = getattr(args, "dry_run", False) or os.getenv("DRY_RUN", "False").lower() == "true"
    
    asyncio.run(run_daily_scan(market=args.market, dry_run=is_dry_run))
