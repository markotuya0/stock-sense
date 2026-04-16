from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User
from services.auth_service import get_current_user
import secrets

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the current user profile including linking status."""
    return {
        "email": current_user.email,
        "full_name": current_user.full_name,
        "tier": current_user.tier,
        "telegram_linked": current_user.telegram_chat_id is not None,
        "whatsapp_linked": current_user.phone is not None
    }

@router.post("/telegram/generate-link")
def generate_telegram_link(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generates a unique code for the user to link their Telegram account."""
    if not current_user.telegram_linking_code:
        current_user.telegram_linking_code = secrets.token_hex(8)
        db.commit()
    
    bot_username = "StockSenseAIBot" # Replace with real bot username
    link = f"https://t.me/{bot_username}?start={current_user.telegram_linking_code}"
    
    return {"link": link, "code": current_user.telegram_linking_code}
