from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User
import structlog
import requests
from config import settings

log = structlog.get_logger()
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/telegram")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Handles incoming Telegram messages for account linking."""
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
