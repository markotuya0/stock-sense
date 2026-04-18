# Edge Case Testing Suite - StockSense Stability

All fixes must handle edge cases gracefully. This document lists all critical scenarios.

---

## 1. SignalCard Null Guard Tests

### Test Cases:
```typescript
// Case 1.1: Complete null signal (should show defaults, not crash)
signal = null → shows "UNKNOWN", "Unknown Stock", "HOLD", score=0

// Case 1.2: Signal with all null analysis fields
signal = { symbol: "AAPL", analysis: null } 
→ shows "No analysis available", doesn't crash

// Case 1.3: Signal with null signal_type
signal = { symbol: "AAPL", signal_type: null }
→ defaults to "HOLD", shows as red (not BUY)

// Case 1.4: Signal with missing nested fields
signal = { symbol: "AAPL", analysis: { reason: null } }
→ shows "No analysis available"

// Case 1.5: Empty analysis object
signal = { symbol: "AAPL", analysis: {} }
→ shows "No analysis available"
```

### How to Test:
```bash
# Manually edit mock signal in StockDetailPage or DashboardPage
# Simulate null values and verify card renders without console errors
```

---

## 2. Daily Scan Persistence Tests

### Test Case 2.1: Normal Case (5 candidates → 5 signals created)
```bash
- Run startup scan
- Check logs: "Persisted daily signals count=5"
- GET /api/v1/signals → returns non-empty array
```

### Test Case 2.2: Empty Candidates (0 candidates)
```bash
- Scan runs but finds no candidates
- Log: "Daily scan: No candidates found"
- No signals created (count=0 is OK)
```

### Test Case 2.3: Partial DB Failure (3/5 signals persist)
```bash
- Add a constraint violation in one signal (e.g., duplicate symbol)
- Batch should fail, transaction rolls back
- Log: "Failed to persist daily signals" with error
- Zero signals are committed (all-or-nothing)
```

### Test Case 2.4: Market Detection (NGX vs US)
```bash
- Scan includes "ZENITHB.NG" and "AAPL"
- Both persisted correctly
- Check: ZENITHB.NG has market="NGX", AAPL has market="US"
```

---

## 3. AnalysisTerminal SSE Token Tests

### Test Case 3.1: Valid Session (PRO user)
```bash
- User logged in, tier=PRO
- Click "Analyse"
- EventSource connects (no 401)
- Logs stream in real-time
- SSE closes cleanly with `done` event
```

### Test Case 3.2: No Session (Logout)
```bash
- User logs out mid-page
- Click "Analyse" (tier still cached)
- Error: "Authentication error: No valid session"
- No EventSource created (fails before connect)
```

### Test Case 3.3: Tier == FREE (not PRO)
```bash
- User tier is FREE
- Panel shows "Upgrade to Pro to view live Layer 2 analysis."
- EventSource NOT created
- No API call made
```

### Test Case 3.4: SSE Connection Failure
```bash
- Backend crashes or is unreachable
- EventSource onerror fires
- UI shows "Live analysis unavailable right now. Check your connection and try again."
- No crash, clean error handling
```

### Test Case 3.5: Malformed SSE Event (bad JSON)
```bash
- Server sends invalid JSON: "garbage data"
- Catch block in onmessage catches it
- Console logs error, stream continues
- App doesn't crash
```

### Test Case 3.6: SSE Timeout (no data for 60s+)
```bash
- Server stalls but doesn't close connection
- Browser will timeout after ~300s
- UI eventually shows "unavailable"
- No memory leak or hung promise
```

---

## 4. Critic Node Signal Validation Tests

### Test Case 4.1: RSI Overbought vs BUY Signal (should flag)
```
RSI = 75 (overbought)
analyst_signal = "BUY"
Expected: critic logs "RSI overbought (75) but analyst says BUY"
confidence_adjustment = 0.7
```

### Test Case 4.2: RSI Oversold vs SELL Signal (should flag)
```
RSI = 25 (oversold)
analyst_signal = "SELL"
Expected: critic logs "RSI oversold (25) but analyst says SELL"
confidence_adjustment = 0.7
```

### Test Case 4.3: All Signals Aligned (no flags)
```
RSI = 50 (neutral)
macro_score = 0.6 (neutral)
technical_score = 0.5 (neutral)
Expected: "Signal consistent across indicators"
confidence_adjustment = 1.0
```

### Test Case 4.4: analyst_signal == null (should default to HOLD)
```
analyst_signal = null (never set by analyst)
Expected: state.get("analyst_signal", "HOLD") returns "HOLD"
(old bug now fixed - analyst_agent returns analyst_signal)
```

---

## 5. StockDetailPage Change_pct Mapping Tests

### Test Case 5.1: deep_research.move_pct exists
```
data = { deep_research: { move_pct: 2.5 } }
Expected: stockData.change = 2.5
```

### Test Case 5.2: move_pct at root level (fallback 1)
```
data = { move_pct: 1.8, deep_research: {} }
Expected: stockData.change = 1.8
```

### Test Case 5.3: change_pct at root (fallback 2, for compatibility)
```
data = { change_pct: 3.0 }
Expected: stockData.change = 3.0
```

### Test Case 5.4: All missing (fallback to 0)
```
data = {}
Expected: stockData.change = 0
UI shows: "+0% 24h" (not crash, not NaN)
```

---

## 6. Payment API Auth Tests

### Test Case 6.1: Valid Session
```bash
- User logged in
- Fetch /payments/initialize
- Authorization header sent: "Bearer <token>"
- No 401 response
```

### Test Case 6.2: No Session
```bash
- User logged out
- Fetch /payments/initialize
- No Authorization header sent (token is undefined)
- 401 response expected
- Error handler logs: "Payment API auth failed: Unauthorized"
```

### Test Case 6.3: Wrong Base URL (404)
```bash
- If payment router not at /payments (wrong mount prefix)
- Response status = 404
- Error handler logs: "Payment API endpoint not found"
```

### Test Case 6.4: Async Interceptor Race (multiple requests)
```bash
- Multiple payment requests in quick succession
- All use same token (no race condition)
- All succeed or all fail together
```

---

## 7. Null Guard Edge Cases Across All Components

### Test Case 7.1: SignalCard with signal = {}
```
Empty object (not null, but no fields)
Expected: all fields show defaults, no crash
```

### Test Case 7.2: StockDetailPage with data.analysis = undefined
```
data.analysis?.reason → "No summary available"
(already had ?. but double-check)
```

### Test Case 7.3: AnalysisTerminal with ticker = ""
```
useEffect checks if (!ticker) → returns early
No EventSource created (correct)
```

---

## Testing Checklist

### Before Deploy:
- [ ] Start backend: no startup errors
- [ ] Daily scan persistence: logs show "count=N" with N > 0
- [ ] Dashboard loads: signals render without console errors
- [ ] Click signal card: no crash, shows reason text
- [ ] StockDetailPage: change % is non-zero
- [ ] Click "Analyse": SSE streams all 7 agents (including CRITIC)
- [ ] PRO user analysis: critic log shows RSI validation
- [ ] FREE user: shows "Upgrade to Pro" message
- [ ] Logout → click "Analyse": shows "Authentication error"
- [ ] Payment API: interceptor logs auth/404 errors cleanly

### Edge Cases:
- [ ] Dashboard with all-null signal: doesn't crash
- [ ] SSE with malformed JSON: continues streaming
- [ ] Change % field fallback: shows 0 not NaN
- [ ] Critic analyst_signal: reads from analyst_output correctly
- [ ] Daily scan with 0 candidates: no DB write, clean log

---

## Success Criteria

✅ **All tests pass without exceptions**
✅ **All error cases have user-friendly messages**
✅ **No silent failures (all errors logged)**
✅ **All null/undefined fields have fallbacks**
✅ **No infinite loops or memory leaks**
✅ **SSE stream handles network errors gracefully**
✅ **Auth failures show specific error reasons**
