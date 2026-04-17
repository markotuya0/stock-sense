from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User, PortfolioItem
from middleware.auth import get_current_user
from typing import List
from pydantic import BaseModel, Field
from uuid import UUID
import yfinance as yf
import structlog

log = structlog.get_logger()

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


class TradeInput(BaseModel):
    symbol: str = Field(min_length=1)
    shares: float = Field(gt=0)
    price: float = Field(gt=0)
    market: str = Field(default="US")


def _get_or_create_user(db: Session, supabase_user: dict) -> User:
    """Get existing user by email or create new one from Supabase user."""
    email = supabase_user["email"]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=UUID(supabase_user["id"]),
            email=email,
            hashed_password="",  # No password - Supabase handles auth
            full_name=supabase_user.get("full_name", ""),
            tier=supabase_user.get("tier", "FREE"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/")
def get_portfolio(
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    """Returns the user's current holdings and P&L calculated using live market prices."""
    user = _get_or_create_user(db, supabase_user)
    holdings = db.query(PortfolioItem).filter(PortfolioItem.user_id == user.id).all()

    total_value = 0.0
    total_cost = 0.0
    processed_holdings = []

    for item in holdings:
        curr_price = item.avg_price
        try:
            ticker = yf.Ticker(item.symbol)
            curr_price = ticker.fast_info.get("lastPrice", item.avg_price)
        except Exception as exc:
            log.warning("Price fetch failed, using avg_price fallback", symbol=item.symbol, error=str(exc))

        gain = (curr_price - item.avg_price) * item.shares
        cost_basis = item.avg_price * item.shares
        total_value += (curr_price * item.shares)
        total_cost += cost_basis

        processed_holdings.append({
            "id": str(item.id),
            "symbol": item.symbol,
            "market": item.market or "US",
            "shares": item.shares,
            "avg_price": item.avg_price,
            "current_price": round(curr_price, 2),
            "gain": round(gain, 2),
            "pnl": round(gain, 2),
            "pnl_pct": round((gain / cost_basis) * 100, 2) if cost_basis > 0 else 0.0,
        })

    total_pnl = total_value - total_cost
    pnl_percent = (total_pnl / total_cost) * 100 if total_cost > 0 else 0.0

    return {
        "total_value_usd": round(total_value, 2),
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_pnl": round(total_pnl, 2),
        "pnl_percent": round(pnl_percent, 2),
        "holdings": processed_holdings,
    }


@router.post("/trade")
def add_holding(
    payload: TradeInput,
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    """Record a trade in the user's portfolio."""
    user = _get_or_create_user(db, supabase_user)
    symbol = payload.symbol.upper()
    market = payload.market.upper()

    item = db.query(PortfolioItem).filter(
        PortfolioItem.user_id == user.id,
        PortfolioItem.symbol == symbol,
        PortfolioItem.market == market,
    ).first()

    if item:
        new_total_shares = item.shares + payload.shares
        new_total_cost = (item.avg_price * item.shares) + (payload.price * payload.shares)
        item.shares = new_total_shares
        item.avg_price = new_total_cost / new_total_shares
    else:
        item = PortfolioItem(
            user_id=user.id,
            symbol=symbol,
            shares=payload.shares,
            avg_price=payload.price,
            market=market,
        )
        db.add(item)

    db.commit()
    db.refresh(item)
    return {"status": "success", "symbol": item.symbol, "shares": item.shares, "avg_price": item.avg_price}


@router.delete("/{item_id}")
def delete_holding(
    item_id: str,
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    user = _get_or_create_user(db, supabase_user)
    item = db.query(PortfolioItem).filter(
        PortfolioItem.id == item_id,
        PortfolioItem.user_id == user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted", "id": item_id}
