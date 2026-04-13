import sys
from unittest.mock import MagicMock

# Mock external dependencies
sys.modules['yfinance'] = MagicMock()
sys.modules['groq'] = MagicMock()
sys.modules['bs4'] = MagicMock()
sys.modules['requests'] = MagicMock()
sys.modules['pydantic_settings'] = MagicMock()

# Now we can import our modules for logic testing
# We might need to mock config too if it fails during import
from scanner.ngx_scanner import NGXDataCleaningAgent

def test_logic():
    print("Testing NGX Data Cleaning Logic...")
    cleaner = NGXDataCleaningAgent()
    
    # Test kobo/naira fix
    price, corrected = cleaner.fix_currency_unit(65000.0)
    print(f"65000.0 -> {price} (Corrected: {corrected})")
    assert price == 650.0
    
    # Test stale price detection
    is_stale = cleaner.is_stale_price([100.0, 100.0, 100.0])
    print(f"[100, 100, 100] is stale: {is_stale}")
    assert is_stale is True
    
    # Test reliability score
    data = {
        "prices": [10.0, 11.0, 12.0, 13.0],
        "avg_volume_30d": 1000000,
        "rsi": 50.0,
        "last_trade_days_ago": 0
    }
    score, quality, warnings = cleaner.score_reliability(data)
    print(f"Reliability Score: {score}, Quality: {quality}")
    assert score == 100
    assert quality == "HIGH"

    print("\nLogic verification SUCCESSFUL!")

if __name__ == "__main__":
    try:
        test_logic()
    except Exception as e:
        print(f"Logic verification FAILED: {e}")
        sys.exit(1)
