import httpx
import structlog
from typing import Dict, Any, Optional
from config import settings

log = structlog.get_logger()

class PaymentService:
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.base_url = settings.PAYSTACK_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    async def initialize_transaction(self, email: str, amount: int, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Initialize a Paystack transaction.
        Amount should be in Kobo (NGN * 100).
        """
        payload = {
            "email": email,
            "amount": amount,
            "metadata": metadata or {}
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/transaction/initialize",
                    json=payload,
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                log.error("Paystack initialization failed", error=str(e))
                raise Exception(f"Payment initialization failed: {str(e)}")

    async def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """
        Verify a transaction via reference.
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/transaction/verify/{reference}",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                log.error("Paystack verification failed", error=str(e), reference=reference)
                raise Exception(f"Payment verification failed: {str(e)}")

payment_service = PaymentService()
