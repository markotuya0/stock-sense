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
    log.info("Stock search", query=q, user_id=current_user.id)
    
    # DB Search (Fast)
    db_results = db.query(MarketTicker).filter(
        (MarketTicker.symbol.ilike(f"%{q}%")) | (MarketTicker.name.ilike(f"%{q}%"))
    ).limit(5).all()
    
    if db_results:
        return [{"symbol": r.symbol, "name": r.name, "market": r.market} for r in db_results]
        
    # Fallback: yfinance search (Global)
    try:
        yf_search = yf.Search(q, max_results=5).quotes
        return [{"symbol": r["symbol"], "name": r.get("shortname", r["symbol"]), "market": "US"} for r in yf_search]
    except Exception as e:
        log.error("yfinance search failed", error=str(e))
        return []
