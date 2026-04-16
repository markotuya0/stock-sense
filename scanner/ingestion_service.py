from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import structlog

from db.models import MarketSnapshot
from db.session import SessionLocal
from scanner.sources.africanfinancials import AfricanFinancialsSource
from scanner.sources.ngx_official import NGXOfficialSource

log = structlog.get_logger()


class NGXIngestionService:
    """
    Hybrid NGX ingestion service.
    Priority:
      1) NGX official source
      2) African Financials fallback
    """

    def __init__(self) -> None:
        self.primary = NGXOfficialSource()
        self.fallback = AfricanFinancialsSource()

    def fetch_reconciled(self) -> List[Dict[str, Any]]:
        primary_rows = self.primary.fetch()
        fallback_rows = self.fallback.fetch()
        fallback_by_symbol = {row["symbol"]: row for row in fallback_rows if row.get("symbol")}

        reconciled: List[Dict[str, Any]] = []
        seen: set[str] = set()

        for row in primary_rows:
            symbol = row.get("symbol")
            if not symbol:
                continue
            seen.add(symbol)
            alt = fallback_by_symbol.get(symbol)
            reconciled.append(self._merge_row(row, alt))

        for symbol, row in fallback_by_symbol.items():
            if symbol in seen:
                continue
            fallback_only = row.copy()
            fallback_only["confidence"] = "MEDIUM"
            fallback_only["verification_state"] = "stale"
            reconciled.append(fallback_only)

        return reconciled

    def persist_snapshots(self, rows: List[Dict[str, Any]]) -> None:
        if not rows:
            return
        db = SessionLocal()
        try:
            as_of = datetime.now(timezone.utc)
            for row in rows:
                snapshot = MarketSnapshot(
                    symbol=row["symbol"],
                    market=row.get("market", "NGX"),
                    price=float(row.get("price", 0) or 0),
                    previous_close=float(row.get("prev_price", 0) or 0),
                    move_pct=self._move_pct(row),
                    volume=float(row.get("volume", 0) or 0),
                    as_of=as_of,
                    source=row.get("source", "UNKNOWN"),
                    confidence=row.get("confidence", "MEDIUM"),
                    raw_payload=row.get("raw_payload"),
                )
                db.add(snapshot)
            db.commit()
        except Exception as exc:
            db.rollback()
            log.error("Failed to persist market snapshots", error=str(exc))
        finally:
            db.close()

    def ingest(self) -> List[Dict[str, Any]]:
        rows = self.fetch_reconciled()
        self.persist_snapshots(rows)
        return rows

    @staticmethod
    def _move_pct(row: Dict[str, Any]) -> Optional[float]:
        price = float(row.get("price", 0) or 0)
        prev_price = float(row.get("prev_price", 0) or 0)
        if price <= 0 or prev_price <= 0:
            return None
        return round(((price - prev_price) / prev_price) * 100, 4)

    def _merge_row(self, primary_row: Dict[str, Any], fallback_row: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        row = primary_row.copy()
        row["confidence"] = "HIGH"
        row["verification_state"] = "verified"
        if fallback_row:
            primary_price = float(primary_row.get("price", 0) or 0)
            fallback_price = float(fallback_row.get("price", 0) or 0)
            if primary_price <= 0 and fallback_price > 0:
                row.update(fallback_row)
                row["confidence"] = "MEDIUM"
                row["verification_state"] = "stale"
            elif primary_price > 0 and fallback_price > 0:
                drift = abs(primary_price - fallback_price) / primary_price if primary_price else 0
                if drift > 0.15:
                    row["confidence"] = "MEDIUM"
                    row["verification_state"] = "stale"
                    row["reconciliation_warning"] = "Primary and fallback price drift exceeds 15%"
        return row
