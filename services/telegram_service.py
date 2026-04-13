import requests
import structlog
from typing import List, Dict, Any
from datetime import datetime
from config import settings
from scanner.daily_analyst import Layer1Signal

log = structlog.get_logger()

class TelegramService:
    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_PERSONAL_CHAT_ID
        self.base_url = f"https://api.telegram.org/bot{self.token}"

    def _format_briefing(self, signals: List[Layer1Signal]) -> str:
        """Format the morning briefing message."""
        if not signals:
            return "◈ StockSense · Morning Briefing 📊\nNo strong signals detected today."

        date_str = datetime.now().strftime("%A %d %b")
        header = f"◈ StockSense · Morning Briefing 📊\n{date_str} · US + NGX Open\n" + "━" * 20 + "\n\n"
        
        body = ""
        for s in signals:
            signal_emoji = "🟢" if "BUY" in s.signal else "🔴" if "SELL" in s.signal else "🟡"
            body += f"{signal_emoji} {s.signal} · {s.symbol}\n"
            body += f"   Score: {s.score}/10 · Target: {s.price_target} · Risk: {s.risk_score}/10\n"
            body += f"   AI: {s.reason}\n"
            body += f"   Plain English: {s.beginner_note}\n\n"
            body += f"📚 Learn: {s.learn_term} — {s.learn_explanation}\n"
            body += "━" * 20 + "\n\n"

        footer = "⚠️ Not financial advice. Educational only.\n⭐ Upgrade for real-time alerts → stocksense.app"
        
        return header + body + footer

    def send_briefing(self, signals: List[Layer1Signal]) -> bool:
        """Send formatted briefing to Telegram."""
        message = self._format_briefing(signals)
        url = f"{self.base_url}/sendMessage"
        
        try:
            log.info("Sending Telegram briefing", count=len(signals))
            # Use chunks if message is too long (Telegram limit ~4096 chars)
            if len(message) > 4000:
                message = message[:3900] + "...\n\n[Truncated] View more at stocksense.app"

            response = requests.post(url, json={
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "HTML" if "<b>" in message else None # Using simple text for now
            }, timeout=10)
            
            response.raise_for_status()
            log.info("Telegram briefing sent successfully")
            return True
        except Exception as e:
            log.error("Failed to send Telegram briefing", error=str(e))
            return False

if __name__ == "__main__":
    # Test
    from scanner.daily_analyst import Layer1Signal
    test_signals = [
        Layer1Signal(
            symbol="ZENITHB",
            signal="BUY",
            score=7.4,
            price_target=45.0,
            risk_score=4,
            reason="Strong insider buying and favorable NIM environment.",
            beginner_note="Someone high up in the bank just bought a lot of shares.",
            learn_term="NIM",
            learn_explanation="Net Interest Margin measures the difference between interest income and interest paid out."
        )
    ]
    service = TelegramService()
    # service.send_briefing(test_signals) # Uncomment to test with real keys
    print(service._format_briefing(test_signals))
