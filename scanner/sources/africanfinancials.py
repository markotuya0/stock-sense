import structlog
from typing import Any, Dict, List
import httpx
from bs4 import BeautifulSoup
import re

log = structlog.get_logger()

class AfricanFinancialsSource:
    source_name = "AFRICAN_FINANCIALS"
    BASE_URL = "https://www.africanfinancials.com"

    def fetch(self) -> List[Dict[str, Any]]:
        """
        Scrape NGX stock data from AfricanFinancials website.
        Attempts to fetch latest market data for Nigerian stocks.
        """
        try:
            with httpx.Client(timeout=15.0) as client:
                # Try to fetch market data page
                response = client.get(
                    f"{self.BASE_URL}/nigerian-stocks",
                    headers={"User-Agent": "StockSense/1.0"}
                )
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "html.parser")
                stocks = []

                # Look for stock data tables (common HTML patterns)
                for table in soup.find_all("table"):
                    rows = table.find_all("tr")[1:]  # Skip header row
                    for row in rows[:50]:  # Limit to 50 stocks
                        try:
                            cells = row.find_all("td")
                            if len(cells) < 4:
                                continue

                            symbol = cells[0].get_text(strip=True).upper()
                            if not symbol or not symbol.endswith(".NG"):
                                symbol = symbol + ".NG" if symbol else None
                            if not symbol:
                                continue

                            # Extract price and change data
                            price_text = cells[1].get_text(strip=True)
                            price = self._parse_float(price_text)

                            change_text = cells[2].get_text(strip=True) if len(cells) > 2 else "0"
                            change_pct = self._parse_float(re.sub(r"[%\s]", "", change_text))

                            volume_text = cells[3].get_text(strip=True) if len(cells) > 3 else "0"
                            volume = self._parse_float(re.sub(r"[KM\s]", "", volume_text))

                            prev_price = price / (1 + change_pct / 100) if price and change_pct else price

                            stock = self._normalize({
                                "symbol": symbol,
                                "name": symbol,
                                "price": price,
                                "prev_price": prev_price,
                                "volume": volume,
                                "avg_volume_30d": volume,
                                "prices": [],
                                "last_trade_days_ago": 0,
                            })
                            stocks.append(stock)
                        except Exception as e:
                            log.debug("Failed to parse stock row", error=str(e))
                            continue

                log.info("AfricanFinancials scrape complete", stock_count=len(stocks))
                return stocks

        except Exception as e:
            log.warning("AfricanFinancials fetch failed", error=str(e))
            return []

    @staticmethod
    def _parse_float(text: str) -> float:
        """Parse float from text, handling various formats."""
        try:
            text = str(text).strip().replace(",", "").replace("K", "000").replace("M", "000000")
            return float(re.sub(r"[^\d\.]", "", text)) if text else 0.0
        except:
            return 0.0

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
