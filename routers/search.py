from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db.models import SearchHistory, MarketTicker, MarketSnapshot
from middleware.auth import get_current_user
import structlog

log = structlog.get_logger()
router = APIRouter(prefix="/search", tags=["search"])

import yfinance as yf


@router.get("/")
def search_stock(
    q: str,
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    """Universal stock search. Queries DB for known tickers and falls back to yfinance."""
    normalized_q = q.strip()
    if not normalized_q:
        return []

    log.info("Stock search", query=normalized_q, user_id=supabase_user.get("id"))

    # Log search history without FK constraint (Supabase IDs don't exist in our users table)
    from uuid import UUID
    try:
        search_rec = SearchHistory(
            user_id=UUID(supabase_user["id"]),
            query=normalized_q
        )
        db.add(search_rec)
        db.commit()
    except Exception as e:
        # FK constraint may fail for Supabase user IDs not in our users table
        # Fall back to search without history persistence
        log.warning("Search history skipped", error=str(e))

    # DB Search (Fast)
    db_results = db.query(MarketTicker).filter(
        (MarketTicker.symbol.ilike(f"%{normalized_q}%")) | (MarketTicker.name.ilike(f"%{normalized_q}%"))
    ).limit(5).all()

    if db_results:
        payload = []
        for result in db_results:
            latest_snapshot = (
                db.query(MarketSnapshot)
                .filter(MarketSnapshot.symbol == result.symbol)
                .order_by(MarketSnapshot.as_of.desc())
                .first()
            )
            payload.append(
                {
                    "symbol": result.symbol,
                    "name": result.name,
                    "market": result.market,
                    "verification_state": "verified" if latest_snapshot else "stale",
                    "data_source": latest_snapshot.source if latest_snapshot else "MARKET_TICKERS_DB",
                }
            )
        return payload

    # Fallback: yfinance search (Global)
    try:
        yf_search = yf.Search(normalized_q, max_results=5).quotes
        payload = []
        for result in yf_search:
            symbol = result.get("symbol")
            if not symbol:
                continue
            exchange = (result.get("exchange") or result.get("exchDisp") or "").upper()
            market = "NGX" if "NIG" in exchange or "NGX" in exchange else "US"
            payload.append(
                {
                    "symbol": symbol.upper(),
                    "name": result.get("shortname", symbol.upper()),
                    "market": market,
                    "verification_state": "fetching",
                    "data_source": "YFINANCE_SEARCH",
                }
            )
        return payload
    except Exception as e:
        log.error("yfinance search failed", error=str(e))
        return []
