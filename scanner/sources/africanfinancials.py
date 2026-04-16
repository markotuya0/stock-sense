import structlog
from typing import Any, Dict, List

log = structlog.get_logger()


class AfricanFinancialsSource:
    source_name = "AFRICAN_FINANCIALS"

    def fetch(self) -> List[Dict[str, Any]]:
        """
        Placeholder adapter for AfricanFinancials source integration.
        Returns [] until scraper/API wiring is configured.
        """
        log.info("AfricanFinancials source not configured yet; returning empty result")
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
