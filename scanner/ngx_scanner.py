import requests
from bs4 import BeautifulSoup
import structlog
from typing import List, Dict, Any, Tuple
import pandas as pd
from datetime import datetime
from config import settings

log = structlog.get_logger()

class NGXDataCleaningAgent:
    """
    Apply ALL checks below for every NGX stock.
    None of these are optional — NGX data is genuinely unreliable.
    """

    # CHECK 1: Stale price detection
    # Identical closing price for 3+ consecutive days = no real trading
    @staticmethod
    def is_stale_price(prices: List[float], threshold: int = 3) -> bool:
        if len(prices) < threshold:
            return False
        consecutive = 0
        for i in range(1, len(prices)):
            if prices[i] == prices[i-1]:
                consecutive += 1
                if consecutive >= threshold:
                    return True
            else:
                consecutive = 0
        return False

    # CHECK 2: Kobo/Naira confusion
    # NGX equity prices should never be above ₦10,000
    # Prices like 68,000 are almost certainly in kobo (should be ₦680)
    @staticmethod
    def fix_currency_unit(price: float) -> Tuple[float, bool]:
        if price > 10_000:
            return price / 100, True   # (corrected_price, was_corrected)
        return price, False

    # CHECK 3: Zero volume handling
    # NEVER interpolate zero volume — zero means no trading, not missing data
    @staticmethod
    def handle_zero_volume(volume: float) -> float | None:
        if volume == 0:
            return None  # explicit null, not 0
        return volume

    # CHECK 4: RSI requires specialized handling (trading days only)
    # This will be used in Layer 2, but we keep the logic here for consistency
    @staticmethod
    def get_trading_days(price_history: List[Dict[str, Any]]) -> List[float]:
        return [
            d["close"] for d in price_history
            if d.get("volume") and d["volume"] > 0
        ]

    # CHECK 5: Data reliability scoring
    def score_reliability(self, data: Dict[str, Any]) -> Tuple[int, str, List[str]]:
        score = 100
        warnings = []

        prices = data.get("prices", [])
        if self.is_stale_price(prices):
            score -= 30
            warnings.append("Price unchanged for 3+ consecutive days")

        vol_30d = data.get("avg_volume_30d", 0)
        if vol_30d < 500_000:  # less than 500k shares avg volume
            score -= 20
            warnings.append(f"Low liquidity: avg volume {vol_30d:,.0f}")

        if data.get("rsi") is None:
            score -= 15
            warnings.append("RSI unavailable — insufficient trading history")

        if data.get("last_trade_days_ago", 0) > 2:
            days = data["last_trade_days_ago"]
            score -= 15
            warnings.append(f"Last trade was {days} days ago")

        if score >= 70:   quality = "HIGH"
        elif score >= 40: quality = "MEDIUM"
        else:             quality = "LOW"

        return score, quality, warnings

class NGXScanner:
    def __init__(self):
        self.cleaner = NGXDataCleaningAgent()
        self.min_price = settings.NGX_PRICE_MIN
        self.min_momentum = settings.MIN_MOMENTUM_NGX
        self.min_volume_ratio = settings.MIN_VOLUME_RATIO

    def fetch_ngx_data(self) -> List[Dict[str, Any]]:
        """
        Scrape NGX data. 
        In production, this would hit a target URL or API.
        For now, we implement the structure.
        """
        # Example URL: https://ngxgroup.com/exchange/data/equities-price-list/
        log.info("Fetching NGX market data via scraper")
        
        # This is where the scraping logic would go.
        # Since we can't hit live sites reliably in this environment, 
        # we'll return a sample list that demonstrates the cleaning logic.
        
        sample_data = [
            {
                "symbol": "DANGCEM",
                "name": "Dangote Cement Plc",
                "price": 68000.0,  # Kobo/Naira confusion case
                "prev_price": 670.0,
                "volume": 2500000,
                "avg_volume_30d": 1800000,
                "prices": [670.0, 670.0, 670.0, 670.0], # Stale price case
                "last_trade_days_ago": 0
            },
            {
                "symbol": "ZENITHB",
                "name": "Zenith Bank Plc",
                "price": 38.50,
                "prev_price": 37.80,
                "volume": 15000000,
                "avg_volume_30d": 12000000,
                "prices": [36.0, 37.0, 37.5, 37.8, 38.5],
                "last_trade_days_ago": 0
            }
        ]
        return sample_data

    def scan(self) -> List[Dict[str, Any]]:
        raw_data = self.fetch_ngx_data()
        candidates = []

        for item in raw_data:
            try:
                # 1. Fix Currency Unit
                price, was_corrected = self.cleaner.fix_currency_unit(item["price"])
                if was_corrected:
                    log.info("Fixed kobo/naira confusion", symbol=item["symbol"], old=item["price"], new=price)
                
                # 2. Handle Zero Volume
                volume = self.cleaner.handle_zero_volume(item["volume"])
                
                # 3. Reliability Scoring
                item["price"] = price # Update for scoring
                score, quality, warnings = self.cleaner.score_reliability(item)
                
                # Apply gates
                if price < self.min_price:
                    continue
                
                avg_vol = item.get("avg_volume_30d", 1)
                volume_ratio = volume / avg_vol if volume and avg_vol > 0 else 0
                if volume_ratio < self.min_volume_ratio:
                    continue
                
                prev_price = item["prev_price"]
                change_pct = abs(price - prev_price) / prev_price * 100
                if change_pct < self.min_momentum:
                    continue

                candidates.append({
                    "symbol": item["symbol"],
                    "name": item["name"],
                    "price": round(price, 2),
                    "change_pct": round(change_pct, 2),
                    "volume_ratio": round(volume_ratio, 2),
                    "market": "NGX",
                    "currency": "NGN",
                    "exchange": "NGX",
                    "data_quality": quality,
                    "reliability_score": score,
                    "warnings": warnings
                })

            except Exception as e:
                log.error("Error processing NGX ticker", symbol=item.get("symbol"), error=str(e))
                continue

        return candidates

if __name__ == "__main__":
    scanner = NGXScanner()
    print(scanner.scan())
