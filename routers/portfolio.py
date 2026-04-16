from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User
from services.auth_service import get_current_user
from typing import List

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

from db.models import User, PortfolioItem
import yfinance as yf

@router.get("/")
def get_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns the user's current holdings and P&L calculated using live market prices."""
    holdings = db.query(PortfolioItem).filter(PortfolioItem.user_id == current_user.id).all()
    
    total_value = 0.0
    processed_holdings = []
    
    for item in holdings:
        # Fetch live price (Mock cache: in production use Redis)
        ticker = yf.Ticker(item.symbol)
        curr_price = ticker.fast_info.get("lastPrice", item.avg_price)
        
        gain = (curr_price - item.avg_price) * item.shares
        total_value += (curr_price * item.shares)
        
        processed_holdings.append({
            "symbol": item.symbol,
            "shares": item.shares,
            "avg_price": item.avg_price,
            "current_price": round(curr_price, 2),
            "gain": round(gain, 2),
            "market": item.market
        })
        
    return {
        "total_value_usd": round(total_value, 2),
        "holdings": processed_holdings
    }

@router.post("/trade")
def add_holding(symbol: str, shares: float, price: float, market: str = "US", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Record a trade in the user's portfolio."""
    item = PortfolioItem(
        user_id=current_user.id,
        symbol=symbol.upper(),
        shares=shares,
        avg_price=price,
        market=market
    )
    db.add(item)
    db.commit()
    return {"status": "success", "symbol": symbol}
