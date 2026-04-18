from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import structlog
import time

from config import settings
from routers import search, signals, analysis, payment, accuracy, portfolio, users, webhooks
from db.session import engine, Base, SessionLocal
from db.models import MarketTicker, Signal
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.rate_limit import limiter
from services.accuracy_service import populate_accuracy_records
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone

# Setup logger
log = structlog.get_logger()

# Initialize tables (Note: Use Alembic for production migrations)
Base.metadata.create_all(bind=engine)

# Initialize tables
Base.metadata.create_all(bind=engine)

def seed_market_tickers():
  """Seed market_tickers table with popular US and NGX stocks on first boot."""
  db = SessionLocal()
  try:
    # Check if table is already seeded
    count = db.query(MarketTicker).count()
    if count > 0:
      return

    # Popular US stocks
    us_tickers = [
      ("AAPL", "Apple Inc.", "US"),
      ("MSFT", "Microsoft Corporation", "US"),
      ("NVDA", "NVIDIA Corporation", "US"),
      ("GOOGL", "Alphabet Inc.", "US"),
      ("AMZN", "Amazon.com Inc.", "US"),
      ("TSLA", "Tesla Inc.", "US"),
      ("META", "Meta Platforms Inc.", "US"),
      ("JPM", "JPMorgan Chase & Co.", "US"),
      ("V", "Visa Inc.", "US"),
      ("JNJ", "Johnson & Johnson", "US"),
      ("WMT", "Walmart Inc.", "US"),
      ("PG", "Procter & Gamble Company", "US"),
      ("KO", "The Coca-Cola Company", "US"),
      ("MCD", "McDonald's Corporation", "US"),
      ("BA", "The Boeing Company", "US"),
    ]

    # Popular NGX stocks
    ngx_tickers = [
      ("ZENITHB.NG", "Zenith Bank PLC", "NGX"),
      ("GTCO.NG", "Guaranty Trust Company", "NGX"),
      ("FLOURISH.NG", "Flourish Nigeria Limited", "NGX"),
      ("MTNN.NG", "Airtel Africa PLC", "NGX"),
      ("BUA.NG", "BUA Group Limited", "NGX"),
    ]

    for symbol, name, market in us_tickers + ngx_tickers:
      ticker = MarketTicker(symbol=symbol, name=name, market=market, is_active=True)
      db.add(ticker)

    db.commit()
    log.info("Seeded market_tickers table with 20 popular stocks")
  except Exception as e:
    log.error("Failed to seed market_tickers", error=str(e))
    db.rollback()
  finally:
    db.close()

async def persist_daily_signals(signals: list, db: SessionLocal):
  """Persist Layer1 signals from daily analyst to signals table."""
  try:
    count = 0
    for sig in signals:
      market = "NGX" if sig.symbol.endswith((".NG", ".LG")) else "US"
      db_signal = Signal(
          symbol=sig.symbol,
          name=sig.symbol,
          signal_type=sig.signal,
          score=sig.score,
          price_at_signal=0.0,
          price_target=sig.price_target,
          risk_score=sig.risk_score,
          analysis={
              "reason": sig.reason,
              "beginner_note": sig.beginner_note,
              "learn_term": sig.learn_term,
              "learn_explanation": sig.learn_explanation,
          },
          market=market,
          is_layer2=False,
          deep_research={
              "status": "scanner",
              "source": "daily-analyst",
              "generated_at": datetime.now(timezone.utc).isoformat(),
          },
      )
      db.add(db_signal)
      count += 1
    db.commit()
    log.info("Persisted daily signals to DB", count=count)
  except Exception as e:
    log.error("Failed to persist daily signals", error=str(e))
    db.rollback()

async def run_daily_scan():
  """Run the daily market scan to generate signals."""
  try:
    log.info("Starting daily market scan (US only)")
    from scanner.us_scanner import USScanner
    from scanner.daily_analyst import DailyAnalyst
    from db.session import SessionLocal
    import asyncio

    db = SessionLocal()
    scanner = USScanner()
    candidates = scanner.scan()

    if candidates:
      analyst = DailyAnalyst()
      signals = await analyst.analyze_all(candidates)
      await persist_daily_signals(signals, db)
      log.info(f"Daily scan complete: {len(candidates)} US candidates analyzed, {len(signals)} signals created")
    else:
      log.warning("Daily scan: No candidates found")

    db.close()
  except Exception as e:
    log.error("Daily scan failed", error=str(e))

app = FastAPI(title="StockSense AI API", version="0.2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
  """Seed initial data and start background scheduler on app startup."""
  import asyncio

  seed_market_tickers()

  # Initialize and start the background scheduler for daily scans
  scheduler = BackgroundScheduler()
  # Run daily scan at 6am UTC (wrap async function for scheduler)
  scheduler.add_job(lambda: asyncio.run(run_daily_scan()), 'cron', hour=6, minute=0)
  # Populate accuracy records daily at 9pm UTC (6 hours after scan completes)
  scheduler.add_job(populate_accuracy_records, 'cron', hour=21, minute=0)
  scheduler.start()
  log.info("Background scheduler started. Daily scan scheduled for 6:00 AM UTC, accuracy population at 9:00 PM UTC")

  # Also run scan immediately on startup to populate signals
  await run_daily_scan()
  # Run accuracy population on startup as well
  await populate_accuracy_records()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL] if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Routes
# Auth router removed - Supabase handles authentication
# Keep router commented out in case needed for backward compatibility
# app.include_router(auth.router)
app.include_router(search.router, prefix="/api/v1")
app.include_router(signals.router, prefix="/api/v1")
app.include_router(analysis.router)
app.include_router(payment.router)
app.include_router(accuracy.router, prefix="/api/v1")
app.include_router(portfolio.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "StockSense AI API is online", "version": "0.2.0"}
