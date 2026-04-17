# Testing Guide: StockSense Phases 1-4

## Backend Setup & Testing

### 1. Start the Backend Server

```bash
cd /home/markotuya/Documents/GitHub/stock-sense-1
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
Uvicorn running on http://0.0.0.0:8000
```

### 2. Test Phase 1: Dashboard & Market Data

**Test: Market tickers seeded on startup**
```bash
curl http://localhost:8000/api/v1/search?query=AAPL
```
Expected: Should return AAPL from market_tickers (not empty)

**Test: Daily scan runs on startup**
- Check logs: Should see `"Starting daily market scan (US only)"`
- Check database: `signals` table should have entries after ~5 seconds

### 3. Test Phase 2: Agent Pipeline

**Start a real-time analysis (requires PRO tier)**
```bash
# First authenticate and get token, then:
curl -N "http://localhost:8000/api/v1/analysis/stream/AAPL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected SSE events:
1. `message` event: "Analysis started for AAPL"
2. Multiple `message` events: log lines from each agent:
   - `[RESEARCHER] Fetching AAPL fundamental data...`
   - `[MACRO] Fetching live US macro data...` (with actual FRED rates)
   - `[TECHNICAL] Calculating RSI and MACD...`
   - `[RISK] Analyzing volatility and liquidity...`
   - `[ANALYST] Synthesizing all data layers...`
   - `[CRITIC] Validating signal consistency...` **(NEW - 7th agent)**
   - `[ARBITER] Finalizing institutional report...`
3. Final `done` event with `final_signal` (BUY/HOLD/SELL)

**Verify macro data is real (not hallucinated)**
- Check logs for FRED API calls
- Should see values like "10Y Treasury Yield: 4.25%", "Fed Funds Rate: 4.50%"
- Should NOT see made-up percentages

### 4. Test Phase 3: Cache & Budget

**Test: Cache is working**
```bash
# Run analysis twice for same symbol
curl -N "http://localhost:8000/api/v1/analysis/stream/AAPL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Second run should be faster (cached yfinance data)
curl -N "http://localhost:8000/api/v1/analysis/stream/AAPL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: Second run should complete in 2-3 seconds (vs 10+ for first run)

**Test: Budget enforcement**
```bash
# Run analysis 5+ times with same user within 1 minute
# After 3rd run, should get 429 error:
curl -N "http://localhost:8000/api/v1/analysis/stream/AAPL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Response: {"detail": "Daily API budget exceeded..."}
```

**Test: Accuracy records population**
- Check database: `accuracy_records` table
- Should have entries for signals older than 3 days
- Run manually: `python -c "from services.accuracy_service import populate_accuracy_records; populate_accuracy_records()"`

### 5. Test Phase 4: NGX & Security

**Test: AfricanFinancials scraper**
```bash
# Check NGX data ingestion
curl http://localhost:8000/api/v1/search?query=ZENITHB.NG
```

Expected: Should return NGX stocks (not empty)

**Test: Telegram webhook security**
```bash
# Try without signature (should fail)
curl -X POST http://localhost:8000/api/v1/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "/start abc123", "chat": {"id": 123}}}'
# Expected: 401 Unauthorized

# Try with signature (requires TELEGRAM_SECRET_TOKEN in .env)
curl -X POST http://localhost:8000/api/v1/webhooks/telegram \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: YOUR_SECRET" \
  -d '{"message": {"text": "/start abc123", "chat": {"id": 123}}}'
# Expected: 200 OK or 404 (user not found with that code)
```

---

## Frontend Setup & Testing

### 1. Build Frontend

```bash
cd frontend
npm install
npm run build
```

Check for errors. If successful:
```
✓ built in 2.34s
```

### 2. Run Frontend Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 3. Test Phase 1: Signup & Dashboard

**Test: Signup page has full_name field (NEW)**
1. Navigate to `http://localhost:5173/signup`
2. Should see form fields in order:
   - ✅ "Full Name" (NEW - was missing before)
   - ✅ "Desired Terminal ID (Email)"
   - ✅ "Secure Access Key (Password)" with eye toggle
3. Enter: Name = "John Analyst", Email, Password
4. Click "Create Analyst Account"
5. Should be redirected to login

**Test: Dashboard shows seeded signals**
1. Login with test account
2. Dashboard should immediately show signals (not empty skeleton)
3. Should see cards for AAPL, MSFT, NVDA, etc. (seeded stocks)

**Test: Search works for US + NGX stocks**
1. Search for "AAPL" → returns result
2. Search for "ZENITHB.NG" → returns NGX result

### 4. Test Phase 2: Agent Pipeline UI

**Test: Analysis streaming works**
1. Click a stock → "Analyse" button (PRO only)
2. Should see SSE events streaming in real-time:
   - Progress bar advancing
   - Log lines appearing: `[RESEARCHER]`, `[MACRO]`, `[TECHNICAL]`, `[RISK]`, `[ANALYST]`, `[CRITIC]` **(NEW)**, `[ARBITER]`
3. After ~10-15 seconds, should see final signal (BUY/HOLD/SELL)

**Test: Polling timeout works**
1. Open a stock detail page
2. If backend hangs/crashes, polling should timeout after 50 seconds
3. Should show error message: "Failed to fetch signal after retries"

### 5. Test Phase 3-4: Full User Flow

**End-to-end test:**
1. Fresh signup with full name
2. Search for AAPL
3. Click signal to view details
4. Run deep analysis (SSE stream with all 7 agents)
5. Verify real-time UI updates

---

## Automated Testing

### Backend Unit Tests

```bash
# Run pytest on API endpoints
pytest routers/ -v

# Run tests for agents
pytest agents/ -v

# Run tests for services
pytest services/ -v
```

### Frontend Tests

```bash
cd frontend
npm run test
```

---

## Debugging Checklist

| Issue | Solution |
|-------|----------|
| "Budget exceeded" on first run | Check Redis connection, verify UPSTASH keys in .env |
| Macro agent returns 0.5 score | FRED API might be down, check logs for API errors |
| Polling never stops | Check max retry count in StockDetailPage (should be 20) |
| Critic node not in logs | Verify graph.py has critic_node import and wiring |
| Full name field missing on signup | Rebuild frontend: `npm run build` |
| Telegram webhook always 401 | Set TELEGRAM_SECRET_TOKEN in .env, or remove for testing |
| NGX search returns empty | Check AfricanFinancials scraper in logs, verify BeautifulSoup installed |
| Cache not working | Verify Redis/Upstash URL in config, check UPSTASH_REDIS_REST_URL in .env |

---

## Key Environment Variables Required

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# LLM APIs
GROQ_API_KEY=your-groq-key
GOOGLE_API_KEY=your-google-key

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-upstash-domain.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_PERSONAL_CHAT_ID=your-chat-id
TELEGRAM_SECRET_TOKEN=your-webhook-secret

# FRED API (Free, no key needed)
# macro_agent.py uses public FRED API endpoints
```

---

## Success Criteria

✅ All tests pass:
- [x] Signup page has full_name field
- [x] Dashboard loads with seeded signals
- [x] Analysis streams 7 agent logs in real-time
- [x] Macro data shows real FRED rates (not hallucinated)
- [x] Critic agent validates signal consistency
- [x] Cache speeds up repeated queries
- [x] Budget enforcement blocks over-budget users
- [x] Telegram webhook requires signature verification
- [x] NGX stocks searchable via AfricanFinancials scraper
- [x] Polling timeout prevents infinite spinners
