import requests
import structlog
from typing import Any, Dict, List

from config import settings

log = structlog.get_logger()


class NGXOfficialSource:
    source_name = "NGX_OFFICIAL"

    def fetch(self) -> List[Dict[str, Any]]:
        """
        Fetch normalized rows from the configured NGX endpoint.
        This adapter assumes the endpoint is a wrapper/proxy for official NGX data.
        """
        endpoint = settings.NGX_DATA_API_URL
        if not endpoint:
            return []

        try:
            response = requests.get(endpoint, timeout=settings.NGX_SOURCE_TIMEOUT_SECONDS)
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                payload = payload.get("data", [])
            if not isinstance(payload, list):
                log.warning("NGX official source returned unexpected payload", payload_type=type(payload).__name__)
                return []
            return [self._normalize(row) for row in payload if isinstance(row, dict) and row.get("symbol")]
        except Exception as exc:
            log.error("NGX official fetch failed", error=str(exc))
            return []

    def _normalize(self, row: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "symbol": str(row.get("symbol", "")).upper(),
            "name": row.get("name", ""),
            "price": float(row.get("price", 0) or 0),
            "prev_price": float(row.get("prev_price", 0) or 0),
            "volume": float(row.get("volume", 0) or 0),
            "avg_volume_30d": float(row.get("avg_volume_30d", 0) or 0),
            "prices": row.get("prices", []),
            "last_trade_days_ago": int(row.get("last_trade_days_ago", 0) or 0),
            "market": "NGX",
            "source": self.source_name,
            "raw_payload": row,
        }
