from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db.models import User, SearchHistory
from middleware.auth import get_current_user
import structlog

log = structlog.get_logger()
router = APIRouter(prefix="/search", tags=["search"])

from db.models import User, SearchHistory, MarketTicker
import yfinance as yf

@router.get("/")
def search_stock(
    q: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Universal stock search. Queries DB for known tickers and falls back to yfinance."""
    normalized_q = q.strip()
    if not normalized_q:
        return []

    log.info("Stock search", query=normalized_q, user_id=current_user.id)

    db.add(SearchHistory(user_id=current_user.id, query=normalized_q))
    db.commit()
    
    # DB Search (Fast)
    db_results = db.query(MarketTicker).filter(
        (MarketTicker.symbol.ilike(f"%{normalized_q}%")) | (MarketTicker.name.ilike(f"%{normalized_q}%"))
    ).limit(5).all()
    
    if db_results:
        return [{"symbol": r.symbol, "name": r.name, "market": r.market} for r in db_results]
        
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
                }
            )
        return payload
    except Exception as e:
        log.error("yfinance search failed", error=str(e))
        return []
