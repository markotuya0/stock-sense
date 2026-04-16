import requests
import structlog
from typing import List, Dict, Any, Optional
from datetime import datetime
from config import settings
from db.models import User, BroadcastDelivery
from sqlalchemy.orm import Session

log = structlog.get_logger()

class BroadcastEngine:
    """Institutional-grade messaging engine for Telegram and WhatsApp."""
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.tg_token = settings.TELEGRAM_BOT_TOKEN
        self.tg_base_url = f"https://api.telegram.org/bot{self.tg_token}"
        self.wa_token = settings.WHATSAPP_API_TOKEN if hasattr(settings, 'WHATSAPP_API_TOKEN') else None
        self.wa_api_url = (
            settings.WHATSAPP_API_URL
            if hasattr(settings, "WHATSAPP_API_URL")
            else "https://graph.facebook.com/v19.0/messages"
        )

    def _format_markdown_for_tg(self, title: str, body: str, footer: str = "") -> str:
        """Create a professional Telegram message."""
        divider = "━" * 20
        return f"<b>◈ {title}</b>\n{divider}\n\n{body}\n\n{footer}"

    async def send_telegram(self, chat_id: str, message: str) -> Dict[str, Any]:
        """Send a direct message via Telegram."""
        url = f"{self.tg_base_url}/sendMessage"
        try:
            response = requests.post(url, json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            }, timeout=10)
            response.raise_for_status()
            payload = response.json()
            return {"ok": True, "provider_message_id": str(payload.get("result", {}).get("message_id", ""))}
        except Exception as e:
            log.error("Telegram broadcast failed", chat_id=chat_id, error=str(e))
            return {"ok": False, "error": str(e)}

    async def send_whatsapp(self, phone: str, message: str) -> Dict[str, Any]:
        """Send a WhatsApp alert (Enterprise Tier Only)."""
        if not self.wa_token:
            error_message = "WhatsApp API token missing"
            log.warning(error_message, phone=phone)
            return {"ok": False, "error": error_message}

        try:
            response = requests.post(
                self.wa_api_url,
                headers={
                    "Authorization": f"Bearer {self.wa_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "messaging_product": "whatsapp",
                    "to": phone,
                    "type": "text",
                    "text": {"body": message},
                },
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
            provider_id = ""
            if isinstance(payload, dict):
                provider_id = str((payload.get("messages") or [{}])[0].get("id", ""))
            return {"ok": True, "provider_message_id": provider_id}
        except Exception as e:
            log.error("WhatsApp broadcast failed", phone=phone, error=str(e))
            return {"ok": False, "error": str(e)}

    def _save_delivery(self, user_id, symbol: str, channel: str, result: Dict[str, Any]) -> None:
        if not self.db:
            return
        delivery = BroadcastDelivery(
            user_id=user_id,
            symbol=symbol,
            channel=channel,
            status="SENT" if result.get("ok") else "FAILED",
            provider_message_id=result.get("provider_message_id"),
            error_message=result.get("error"),
            sent_at=datetime.utcnow() if result.get("ok") else None,
        )
        self.db.add(delivery)
        self.db.commit()

    async def broadcast_signal(self, symbol: str, signal_data: Dict[str, Any], tier_required: str = "FREE"):
        """Broadcasts a signal to all eligible users across their preferred channels."""
        if not self.db:
            log.error("BroadcastEngine requires a DB session for broadcasting.")
            return

        # Fetch users who should receive this
        # Eligibility: User tier >= tier_required AND (has chat_id OR has phone)
        tier_order = {"FREE": 0, "PRO": 1, "ENTERPRISE": 2}
        minimum_tier_rank = tier_order.get(tier_required, 0)

        users = self.db.query(User).filter(User.is_active == True).all()
        eligible_users = [u for u in users if tier_order.get(u.tier or "FREE", 0) >= minimum_tier_rank]
        
        message_tg = self._format_markdown_for_tg(
            f"New Signal: {symbol}",
            f"<b>Action:</b> {signal_data.get('signal', 'HOLD')}\n"
            f"<b>Price:</b> ${signal_data.get('price', 'N/A')}\n"
            f"<b>Rationale:</b> {signal_data.get('reason', 'Deep analysis complete.')}\n\n"
            f"View Full Report: {settings.FRONTEND_URL}/stock/{symbol}"
        )

        for user in eligible_users:
            # 1. Telegram (Free and Up)
            if user.telegram_chat_id:
                tg_result = await self.send_telegram(user.telegram_chat_id, message_tg)
                self._save_delivery(user.id, symbol, "TELEGRAM", tg_result)
            
            # 2. WhatsApp (Enterprise Only)
            if user.tier == "ENTERPRISE" and hasattr(user, 'phone') and user.phone:
                wa_result = await self.send_whatsapp(user.phone, "StockSense Alert: " + message_tg)
                self._save_delivery(user.id, symbol, "WHATSAPP", wa_result)

broadcast_engine = BroadcastEngine()
