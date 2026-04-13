import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import structlog
from typing import List, Dict, Any
from config import settings

log = structlog.get_logger()

class USScanner:
    def __init__(self):
        self.min_price = settings.US_PRICE_MIN
        self.min_volume_ratio = settings.MIN_VOLUME_RATIO
        self.min_momentum = settings.MIN_MOMENTUM_US

    def get_sp500_tickers(self) -> List[str]:
        """Fetch S&P 500 tickers from Wikipedia."""
        try:
            table = pd.read_html('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies')
            df = table[0]
            return df['Symbol'].tolist()
        except Exception as e:
            log.error("Failed to fetch S&P 500 tickers", error=str(e))
            # Fallback to a small list for testing if Wikipedia is down
            return ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA"]

    def scan(self, tickers: List[str] = None) -> List[Dict[str, Any]]:
        """Scan a list of US tickers and apply pre-filters."""
        if not tickers:
            tickers = self.get_sp500_tickers()

        candidates = []
        log.info("Starting US market scan", count=len(tickers))

        for ticker in tickers:
            try:
                # Fetch recent data
                stock = yf.Ticker(ticker)
                hist = stock.history(period="1mo")
                
                if hist.empty or len(hist) < 20:
                    continue

                today = hist.iloc[-1]
                yesterday = hist.iloc[-2]
                avg_volume = hist['Volume'].iloc[-21:-1].mean()

                price = today['Close']
                volume = today['Volume']
                prev_price = yesterday['Close']
                
                # Apply gates
                # 1. Price gate
                if price < self.min_price:
                    continue
                
                # 2. Volume gate
                volume_ratio = volume / avg_volume if avg_volume > 0 else 0
                if volume_ratio < self.min_volume_ratio:
                    continue
                
                # 3. Momentum gate
                change_pct = abs(price - prev_price) / prev_price * 100
                if change_pct < self.min_momentum:
                    continue

                # Candidate found
                candidates.append({
                    "symbol": ticker,
                    "name": stock.info.get("longName", ticker),
                    "price": round(price, 2),
                    "change_pct": round(change_pct, 2),
                    "volume_ratio": round(volume_ratio, 2),
                    "market": "US",
                    "currency": "USD",
                    "exchange": stock.info.get("exchange", "Unknown")
                })
                
                log.debug("Found candidate", symbol=ticker, change_pct=change_pct)

            except Exception as e:
                log.error("Error scanning ticker", ticker=ticker, error=str(e))
                continue

        log.info("US scan complete", candidates_found=len(candidates))
        return candidates

if __name__ == "__main__":
    scanner = USScanner()
    # Test with top 10
    results = scanner.scan(["AAPL", "TSLA", "NVDA", "AMD", "MSFT", "GOOGL", "AMZN", "META", "NFLX", "INTC"])
    print(results)
