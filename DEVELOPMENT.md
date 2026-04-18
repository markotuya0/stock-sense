# Development Guide

## Architecture

### Frontend (`frontend/src/`)
```
pages/              # Route components (Dashboard, StockDetail, etc)
features/           # Feature-specific components (signals, auth, dashboard, landing)
components/         # Reusable design system & UI elements
store/              # Zustand state management
api/                # API client & service calls
lib/                # Utilities (badge helpers, Supabase client, etc)
```

### Backend
```
agents/             # 7-agent LangGraph pipeline
routers/            # FastAPI endpoint handlers
services/           # Business logic (accuracy, budget, etc)
db/                 # SQLAlchemy models & session
scanner/            # Daily market analysis
middleware/         # Auth, rate limiting, security headers
scripts/            # Utility scripts (health checks, migrations)
```

## Key Flows

### 1. User Signs Up
1. Frontend: `SignupPage.tsx` → calls `/auth/signup`
2. Backend: Supabase handles auth, stores `tier: FREE`
3. Frontend: Redirects to dashboard

### 2. User Views Dashboard
1. Frontend: `DashboardPage.tsx` calls `/signals`
2. Backend: Returns latest 20 signals from database
3. Frontend: Displays `SignalCard` components with sentiment badges

### 3. User Clicks "Deep Research"
1. Frontend: Opens `StockDetailPage.tsx`
2. Frontend: Calls `/signals/symbol/{symbol}` to get or trigger realtime fetch
3. If signal missing, backend enqueues `_generate_realtime_signal()` (yfinance lookup)
4. Frontend polls `/signals/symbol/{symbol}/status` until ready
5. Frontend calls `/analysis/stream/{symbol}` (SSE)
6. Backend: Runs 7-agent pipeline, streams logs in real-time
7. Frontend: `AnalysisTerminal.tsx` displays live logs, marks agents as complete

### 4. Daily Scan (Auto at 6am UTC)
1. `main.py` startup event calls `run_daily_scan()`
2. `USScanner` → identifies 500+ stock candidates
3. `DailyAnalyst` (Groq) → generates signals in batches
4. Signals persisted to database with `price_at_signal` fetched live
5. Telegram alerts sent (if enabled)

## Common Tasks

### Add a New API Endpoint
```python
# In routers/new_feature.py
from fastapi import APIRouter, Depends
from db.session import get_db

router = APIRouter(prefix="/new-feature", tags=["feature"])

@router.get("/endpoint")
def get_data(db: Session = Depends(get_db)):
    return {"data": "..."}

# In main.py
from routers import new_feature
app.include_router(new_feature.router, prefix="/api/v1")
```

### Add a New Frontend Page
```typescript
// src/pages/NewPage.tsx
import React from 'react';

export const NewPage: React.FC = () => {
  return <div>Content</div>;
};

// In src/App.tsx, add route:
<Route path="/new-page" element={<NewPage />} />
```

### Add a Loading State
```typescript
// Use the Skeleton component
import { Skeleton } from '../components/ui/Skeleton';

if (loading) return <Skeleton className="h-96 w-full" />;
```

### Fix a Bug in the Pipeline
1. Check `agents/state.py` for available fields
2. Verify LLM response format (Gemini or Groq)
3. Update the agent (e.g., `analyst_agent.py`)
4. Test: `curl http://localhost:8000/api/v1/analysis/stream/AAPL`

## Testing

### Manual Testing
See [TESTING_GUIDE.md](TESTING_GUIDE.md) for step-by-step manual tests.

### Automated Tests
```bash
pytest routers/ -v
pytest agents/ -v
pytest services/ -v
```

## Performance Notes

- **Cache:** Redis caches yfinance data for 24 hours (speeds up repeated queries)
- **Budget:** User spending tracked; Pro tier gets 3 analyses/day
- **SSE Streaming:** Analysis logs streamed real-time, reduces perceived latency
- **Groq Fallback:** If Gemini fails, automatically falls back to Groq (no downtime)

## Debugging

### Backend
```bash
# Watch logs during analysis
tail -f app.log

# Check database
psql $DATABASE_URL -c "SELECT * FROM signals LIMIT 5;"

# Monitor Redis cache
redis-cli KEYS "yfinance:*"
```

### Frontend
```bash
# Dev tools
npm run dev

# Browser console logs show API errors
# Check Network tab for SSE events
```

## Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database migrations run
- [ ] Frontend built (`npm run build`)
- [ ] Supabase auth configured
- [ ] Rate limits tested
- [ ] Telegram webhook configured (optional)
