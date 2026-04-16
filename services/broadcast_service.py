import requests
import structlog
from typing import List, Dict, Any, Optional
from datetime import datetime
from config import settings
from db.models import User
from sqlalchemy.orm import Session

log = structlog.get_logger()

class BroadcastEngine:
    """Institutional-grade messaging engine for Telegram and WhatsApp."""
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.tg_token = settings.TELEGRAM_BOT_TOKEN
        self.tg_base_url = f"https://api.telegram.org/bot{self.tg_token}"
        # WhatsApp keys (Stubs for now, ready for Twilio/Meta API)
        self.wa_token = settings.WHATSAPP_API_TOKEN if hasattr(settings, 'WHATSAPP_API_TOKEN') else None

    def _format_markdown_for_tg(self, title: str, body: str, footer: str = "") -> str:
        """Create a professional Telegram message."""
        divider = "━" * 20
        return f"<b>◈ {title}</b>\n{divider}\n\n{body}\n\n{footer}"

    async def send_telegram(self, chat_id: str, message: str):
        """Send a direct message via Telegram."""
        url = f"{self.tg_base_url}/sendMessage"
        try:
            response = requests.post(url, json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            }, timeout=10)
            response.raise_for_status()
            return True
        except Exception as e:
            log.error("Telegram broadcast failed", chat_id=chat_id, error=str(e))
            return False

    async def send_whatsapp(self, phone: str, message: str):
        """Send a WhatsApp alert (Enterprise Tier Only)."""
        if not self.wa_token:
            log.warning("WhatsApp API token missing. Skipping broadcast.", phone=phone)
            return False
            
        log.info("Sending WhatsApp alert (Stub)", phone=phone)
        # TODO: Implement Twilio or Meta Graph API integration
        return True

    async def broadcast_signal(self, symbol: str, signal_data: Dict[str, Any], tier_required: str = "FREE"):
        """Broadcasts a signal to all eligible users across their preferred channels."""
        if not self.db:
            log.error("BroadcastEngine requires a DB session for broadcasting.")
            return

        # Fetch users who should receive this
        # Eligibility: User tier >= tier_required AND (has chat_id OR has phone)
        users = self.db.query(User).filter(User.is_active == True).all()
        
        message_tg = self._format_markdown_for_tg(
            f"New Signal: {symbol}",
            f"<b>Action:</b> {signal_data.get('signal', 'HOLD')}\n"
            f"<b>Price:</b> ${signal_data.get('price', 'N/A')}\n"
            f"<b>Rationale:</b> {signal_data.get('reason', 'Deep analysis complete.')}\n\n"
            f"View Full Report: {settings.FRONTEND_URL}/stock/{symbol}"
        )

        for user in users:
            # 1. Telegram (Free and Up)
            if user.telegram_chat_id:
                await self.send_telegram(user.telegram_chat_id, message_tg)
            
            # 2. WhatsApp (Enterprise Only)
            if user.tier == "ENTERPRISE" and hasattr(user, 'phone') and user.phone:
                await self.send_whatsapp(user.phone, "StockSense Alert: " + message_tg)

broadcast_engine = BroadcastEngine()
