# Quick Frontend & Backend Test ✅

## Issues Fixed
- ✅ Added `lxml` to requirements (S&P 500 scraper)
- ✅ Made `run_daily_scan()` async to await `DailyAnalyst.analyze_all()`
- ✅ All 31 implementation checks pass

---

## Test in 5 Minutes

### **Terminal 1: Backend**
```bash
cd /home/markotuya/Documents/GitHub/stock-sense-1
source venv/bin/activate
pip install -q lxml  # Just added, make sure it's installed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Expected: `Application startup complete` with no errors

### **Terminal 2: Frontend**
```bash
cd /home/markotuya/Documents/GitHub/stock-sense-1/frontend
npm run dev
```

✅ Expected: `http://localhost:5173` opens automatically

---

## What to Test (2 min each)

### 1️⃣ **Signup Page** (New full_name field)
1. Go to `http://localhost:5173/signup`
2. **See**: "Full Name" field at top (NEW!)
3. **Fill**: Name, Email, Password with eye toggle
4. **Click**: "Create Analyst Account"
5. **Expected**: Redirect to login ✅

### 2️⃣ **Dashboard** (Seeded signals)
1. Login with test account
2. **See**: Cards for AAPL, MSFT, NVDA, GOOGL, TSLA (seeded)
3. **Not empty skeletons!**
4. Expected: Signals loaded immediately ✅

### 3️⃣ **Search** (US + NGX)
1. Search "AAPL" → Returns result ✅
2. Search "ZENITHB.NG" → Returns NGX result ✅

### 4️⃣ **Analysis Pipeline** (7-Agent SSE Stream)
1. Click a signal → "Analyse" button (PRO user only)
2. **Watch console** for streaming logs:
   ```
   [RESEARCHER] Fetching AAPL fundamental data...
   [MACRO] Fetching live US macro data...
   [TECHNICAL] Calculating RSI and MACD...
   [RISK] Analyzing volatility...
   [ANALYST] Synthesizing all data...
   [CRITIC] Validating signal consistency...  ← NEW 7th agent
   [ARBITER] Finalizing report...
   ```
3. **Final**: Shows BUY/HOLD/SELL signal ✅

### 5️⃣ **Macro Data** (Real FRED API, not hallucinated)
1. During analysis (step 4), check browser DevTools → Network
2. Filter SSE events for "MACRO" log
3. **Should see**: "10Y Treasury: 4.25%", "Fed Funds Rate: 4.50%" (real data)
4. **NOT**: "macro_score: 0.5" (that's hallucinated) ✅

---

## Verify Backend Logs

While analysis runs, backend logs should show:

```
[RESEARCHER] Fetching AAPL fundamental data...
[MACRO] Fetching live US macro data...
[TECHNICAL] Calculating RSI and MACD...
[RISK] Analyzing volatility...
[ANALYST] Synthesizing all data...
[CRITIC] Validating signal consistency...
[ARBITER] Finalizing report...
```

**NOT** any of these errors:
- ❌ "coroutine was never awaited"
- ❌ "lxml import failed"
- ❌ "Failed to fetch S&P 500"

---

## Success Checklist

| Feature | Status |
|---------|--------|
| Signup has full_name field | ☐ |
| Dashboard shows 5 seeded stocks | ☐ |
| Search works (US + NGX) | ☐ |
| Analysis streams 7 agent logs | ☐ |
| Macro data is real (FRED API) | ☐ |
| Critic node log appears | ☐ |
| Final signal (BUY/HOLD/SELL) shown | ☐ |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot find lxml" | `pip install lxml` |
| Frontend build fails | `rm frontend/node_modules && npm install` |
| Backend port already in use | Change port: `--port 8001` |
| No signals on dashboard | Wait 10s, refresh page |
| Analysis times out | Check GROQ/Google API keys in `.env` |
| Critic logs not showing | Rebuild frontend: `npm run build` |

---

## Next: Automated Tests

```bash
# Verify all 31 implementation checks
python3 verify_implementation.py

# Run pytest
pytest routers/ -v
pytest agents/ -v
```

---

**All phases complete!** 🎉

When ready:
1. Keep terminals running
2. Test steps 1-5 above
3. Check browser console for errors
4. Take screenshot of final signal

Then ready for production deployment.
