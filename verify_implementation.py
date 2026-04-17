#!/usr/bin/env python3
"""
Verification script to check if all Phase 1-4 implementation is properly wired.
Run this to diagnose setup issues before testing.
"""

import sys
import importlib.util
from pathlib import Path

def check_import(module_path: str, module_name: str) -> bool:
    """Check if a module can be imported."""
    try:
        spec = importlib.util.spec_from_file_location(module_name, module_path)
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return True
    except Exception as e:
        print(f"  ❌ Import failed: {e}")
        return False
    return False

def check_file_contains(filepath: str, text: str) -> bool:
    """Check if a file contains specific text."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            return text in content
    except:
        return False

print("🔍 StockSense Implementation Verification")
print("=" * 50)

checks_passed = 0
checks_total = 0

# Phase 1 Checks
print("\n📋 Phase 1: Dashboard & Scheduler")
print("-" * 50)

checks = [
    ("Market ticker seeding", "main.py", "seed_market_tickers"),
    ("APScheduler integration", "main.py", "BackgroundScheduler"),
    ("Daily scan job", "main.py", "run_daily_scan"),
    ("Polling timeout fix", "frontend/src/pages/StockDetailPage.tsx", "MAX_RETRIES"),
    ("REDIS_URL property", "config.py", "def REDIS_URL"),
]

for check_name, filepath, search_text in checks:
    checks_total += 1
    if check_file_contains(filepath, search_text):
        print(f"  ✅ {check_name}")
        checks_passed += 1
    else:
        print(f"  ❌ {check_name}")

# Phase 2 Checks
print("\n📋 Phase 2: Agent Pipeline")
print("-" * 50)

checks = [
    ("FRED API integration", "agents/macro_agent.py", "fetch_us_macro_data"),
    ("Technical node async", "agents/technical_node.py", "async def technical_node"),
    ("Risk node async", "agents/risk_node.py", "async def risk_node"),
    ("Researcher yfinance cache", "agents/researcher.py", "await CacheService"),
    ("Critic node import", "agents/graph.py", "from .nodes.critic_node"),
    ("Critic node in graph", "agents/graph.py", "add_node(\"critic\""),
    ("Critic → Synthesizer wiring", "agents/graph.py", "add_edge(\"critic\", \"synthesizer\")"),
    ("Signal detail endpoint", "routers/signals.py", "_build_verification_payload(signal, db)"),
    ("LLM response tokens", "services/llm_service.py", "tokens_in"),
]

for check_name, filepath, search_text in checks:
    checks_total += 1
    if check_file_contains(filepath, search_text):
        print(f"  ✅ {check_name}")
        checks_passed += 1
    else:
        print(f"  ❌ {check_name}")

# Phase 3 Checks
print("\n📋 Phase 3: Cache & Budget")
print("-" * 50)

checks = [
    ("Redis client init", "services/cache_service.py", "Redis("),
    ("Redis fallback", "services/cache_service.py", "except Exception"),
    ("Budget check in analysis", "routers/analysis.py", "await check_budget"),
    ("Researcher budget record", "agents/researcher.py", "await record_spend"),
    ("Macro budget record", "agents/macro_agent.py", "await record_spend"),
    ("Analyst budget record", "agents/analyst_agent.py", "await record_spend"),
    ("Arbiter budget record", "agents/arbiter_writer.py", "await record_spend"),
    ("Accuracy service", "services/accuracy_service.py", "calculate_accuracy"),
    ("Accuracy scheduler", "main.py", "populate_accuracy_records"),
]

for check_name, filepath, search_text in checks:
    checks_total += 1
    if check_file_contains(filepath, search_text):
        print(f"  ✅ {check_name}")
        checks_passed += 1
    else:
        print(f"  ❌ {check_name}")

# Phase 4 Checks
print("\n📋 Phase 4: NGX & Security")
print("-" * 50)

checks = [
    ("AfricanFinancials scraper", "scanner/sources/africanfinancials.py", "BeautifulSoup"),
    ("AfricanFinancials HTML parsing", "scanner/sources/africanfinancials.py", "find_all(\"table\")"),
    ("Telegram signature verify", "routers/webhooks.py", "_verify_telegram_signature"),
    ("Telegram rate limit", "routers/webhooks.py", "@limiter.limit"),
    ("Telegram secret config", "config.py", "TELEGRAM_SECRET_TOKEN"),
    ("SignupPage full_name state", "frontend/src/pages/auth/SignupPage.tsx", "setFullName"),
    ("SignupPage full_name field", "frontend/src/pages/auth/SignupPage.tsx", "Full Name"),
    ("SignupPage full_name submit", "frontend/src/pages/auth/SignupPage.tsx", "fullName ||"),
]

for check_name, filepath, search_text in checks:
    checks_total += 1
    if check_file_contains(filepath, search_text):
        print(f"  ✅ {check_name}")
        checks_passed += 1
    else:
        print(f"  ❌ {check_name}")

# Summary
print("\n" + "=" * 50)
print(f"Results: {checks_passed}/{checks_total} checks passed")

if checks_passed == checks_total:
    print("✅ All implementation checks passed! Ready to test.")
    sys.exit(0)
else:
    print(f"⚠️  {checks_total - checks_passed} check(s) failed. Review above.")
    sys.exit(1)
