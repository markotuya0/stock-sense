from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User
import structlog
import requests
from config import settings
from middleware.rate_limit import limiter

log = structlog.get_logger()
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

def _verify_telegram_signature(request: Request) -> bool:
    """Verify Telegram bot API secret token from request header."""
    # The Telegram secret token should be set in the environment
    # and configured when setting up the webhook
    telegram_secret = getattr(settings, 'TELEGRAM_SECRET_TOKEN', None)
    if not telegram_secret:
        # If no secret configured, allow but log warning
        log.warning("Telegram webhook secret token not configured")
        return True

    token_header = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if token_header != telegram_secret:
        log.warning("Telegram webhook signature verification failed")
        return False
    return True

@router.post("/telegram")
@limiter.limit("5/minute")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Handles incoming Telegram messages for account linking. Requires valid signature."""
    # Verify Telegram signature
    if not _verify_telegram_signature(request):
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")

    data = await request.json()
    message = data.get("message", {})
    text = message.get("text", "")
    chat_id = message.get("chat", {}).get("id")

    if text.startswith("/start "):
        # Extract linking code: /start <linking_code>
        linking_code = text.split(" ")[1]
        log.info("Telegram linking attempt", code=linking_code, chat_id=chat_id)
        
        user = db.query(User).filter(User.telegram_linking_code == linking_code).first()
        if user:
            user.telegram_chat_id = str(chat_id)
            user.telegram_linking_code = None # One-time use
            db.commit()
            
            # Send success message back to user via Telegram
            send_msg_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            requests.post(send_msg_url, json={
                "chat_id": chat_id,
                "text": "✅ <b>StockSense Account Linked!</b>\nYou will now receive real-time signals and morning briefings here.",
                "parse_mode": "HTML"
            })
            
            return {"status": "success", "linked_user": user.email}
            
    return {"status": "ignored"}
