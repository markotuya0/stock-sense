import pytest
from scanner.us_scanner import USScanner
from scanner.ngx_scanner import NGXDataCleaningAgent
import pandas as pd

# --- US Scanner Tests ---

def test_us_scanner_filter():
    scanner = USScanner()
    
    # Mock some data
    # Case 1: Passes all filters
    passing_data = {
        "Close": [10.0] * 20 + [12.0], # +20% momentum
        "Volume": [1000] * 20 + [2000] # 2x volume ratio
    }
    df_passing = pd.DataFrame(passing_data)
    
    # We would need to mock yfinance to test this fully without hitting API
    # For now, we test the logic we can isolate or mock
    assert scanner.min_price == 1.0
    assert scanner.min_momentum == 1.5

# --- NGX Cleaning Agent Tests ---

def test_ngx_stale_price():
    cleaner = NGXDataCleaningAgent()
    
    # 3 consecutive days same price
    assert cleaner.is_stale_price([100.0, 100.0, 100.0]) is True
    # 2 consecutive days same price
    assert cleaner.is_stale_price([100.0, 100.0, 101.0]) is False
    # Volatile prices
    assert cleaner.is_stale_price([100.0, 101.0, 100.0, 102.0]) is False

def test_ngx_kobo_naira_fix():
    cleaner = NGXDataCleaningAgent()
    
    # Price > 10,000 should be divided by 100
    price, corrected = cleaner.fix_currency_unit(65000.0)
    assert price == 650.0
    assert corrected is True
    
    # Price <= 10,000 should be left alone
    price, corrected = cleaner.fix_currency_unit(9500.0)
    assert price == 9500.0
    assert corrected is False

def test_ngx_zero_volume():
    cleaner = NGXDataCleaningAgent()
    
    assert cleaner.handle_zero_volume(0) is None
    assert cleaner.handle_zero_volume(100) == 100

def test_ngx_reliability_score():
    cleaner = NGXDataCleaningAgent()
    
    # High quality data
    h_data = {
        "prices": [10.0, 11.0, 12.0, 13.0],
        "avg_volume_30d": 1000000,
        "rsi": 50.0,
        "last_trade_days_ago": 0
    }
    score, quality, warnings = cleaner.score_reliability(h_data)
    assert score == 100
    assert quality == "HIGH"
    assert len(warnings) == 0
    
    # Low quality data (stale + low volume + late trade)
    l_data = {
        "prices": [10.0, 10.0, 10.0, 10.0],
        "avg_volume_30d": 100000,
        "rsi": None,
        "last_trade_days_ago": 5
    }
    score, quality, warnings = cleaner.score_reliability(l_data)
    assert quality == "LOW"
    assert "Price unchanged for 3+ consecutive days" in warnings
    assert "Low liquidity: avg volume 100,000" in warnings
