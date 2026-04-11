# StockSense — PERFORMANCE.md
## Performance, Caching & Scalability Reference

> Read before optimising anything. Premature optimisation is wrong.
> These patterns are for when you need them — not before.

---

## Table of Contents

1. [Caching Strategy — Full Reference](#1-caching-strategy)
2. [Database Query Optimisation](#2-database-optimisation)
3. [API Response Times — Targets](#3-api-response-targets)
4. [Agent Pipeline Optimisation](#4-agent-pipeline-optimisation)
5. [Frontend Performance](#5-frontend-performance)
6. [Scalability Path](#6-scalability-path)

---

## 1. Caching Strategy

### Cache keys, TTL, and invalidation rules

```python
# All cache keys follow this pattern: {resource}:{identifier}:{variant}
# Always use Redis for caching — never in-memory (breaks multi-instance)

CACHE_CONFIG = {
    # STOCK PRICES
    "us_price":           {"ttl": 900,    "key": "price:us:{symbol}"},
    "ngx_price":          {"ttl": 1800,   "key": "price:ng:{symbol}"},  # NGX slower
    "crypto_price":       {"ttl": 300,    "key": "price:crypto:{symbol}"},

    # LAYER 1 SIGNALS (daily scanner output)
    "layer1_signal":      {"ttl": 14400,  "key": "signal:l1:{market}:{symbol}"},

    # LAYER 2 ANALYSIS (full agent reports)
    "layer2_report":      {"ttl": 14400,  "key": "analysis:l2:{market}:{symbol}"},
    "layer2_partial":     {"ttl": 14400,  "key": "analysis:partial:{agent}:{market}:{symbol}"},

    # MACRO DATA (changes slowly)
    "macro_ng":           {"ttl": 14400,  "key": "macro:ng"},  # CBN rate, NGN, oil
    "macro_us":           {"ttl": 14400,  "key": "macro:us"},  # Fed rate, CPI

    # REGULATORY DATA (changes rarely)
    "regulatory":         {"ttl": 86400,  "key": "regulatory:{market}:{symbol}"},

    # SEARCH RESULTS
    "search_results":     {"ttl": 3600,   "key": "search:{query_hash}"},
    "trending_stocks":    {"ttl": 3600,   "key": "trending:{market}"},

    # ACCURACY STATS (updated daily)
    "accuracy_summary":   {"ttl": 3600,   "key": "accuracy:summary"},
    "accuracy_market":    {"ttl": 3600,   "key": "accuracy:market:{market}"},

    # USER-SPECIFIC
    "user_portfolio":     {"ttl": 60,     "key": "portfolio:{user_id}"},  # live P&L
    "user_watchlist":     {"ttl": 300,    "key": "watchlist:{user_id}"},
    "daily_picks":        {"ttl": 300,    "key": "picks:{tier}:{market}"},
}

# Cache invalidation rules:
# - Layer 2 analysis: invalidate when price moves >2%
# - User portfolio: invalidate on any trade
# - Daily picks: invalidate at midnight (new scan)
# - Macro data: invalidate on CBN/Fed announcement (manual trigger)
```

### Cache decision matrix for Layer 2 analysis

```python
def get_cache_strategy(symbol: str, market: str, current_price: float, db) -> str:
    """
    Returns one of: FULL_FRESH | PARTIAL_REFRESH | SERVE_CACHE
    Determines how many AI calls to make.
    """
    cached = get_cached_report(symbol, market)

    if not cached:
        return "FULL_FRESH"

    cached_price = cached.get("price_at_analysis", 0)
    if cached_price == 0:
        return "FULL_FRESH"

    price_delta = abs(current_price - cached_price) / cached_price
    cache_age_hours = (datetime.utcnow() - cached["created_at"]).seconds / 3600

    # Signal flip always triggers full refresh
    quick_signal = compute_quick_signal(current_price, cached)
    if quick_signal != cached.get("final_signal"):
        return "FULL_FRESH"

    # Price moved significantly
    if price_delta > 0.05 or cache_age_hours > 8:
        return "FULL_FRESH"

    # Price moved moderately — re-run analyst+critic, reuse macro+regulatory
    if price_delta > 0.02:
        return "PARTIAL_REFRESH"

    # Nothing material changed — zero AI calls
    return "SERVE_CACHE"

# Result: ~80% of requests served from cache
# Cache hit rate target: >75%
# Log cache hits/misses to monitor: log.info("cache_decision", strategy=strategy)
```

---

## 2. Database Optimisation

### Indexes already defined in schema — verify they exist

```sql
-- Verify indexes exist after migration
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('signals', 'analysis_reports', 'users', 'trades');

-- Critical indexes (must exist):
-- signals: (symbol, created_at DESC) — used by GET /signals/{symbol}
-- signals: (market, score DESC, created_at DESC) — used by GET /signals
-- analysis_reports: (user_id, created_at DESC)
-- trades: (user_id, executed_at DESC)
-- users: (email) — used by every login
-- stocks: GIN on to_tsvector — used by search
-- payment_events: (gateway_event_id) — critical for idempotency
```

### Query patterns — always use these

```python
# PAGINATION — never return unbounded results
@router.get("/signals")
async def get_signals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    signals = db.query(Signal)\
        .order_by(Signal.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    return {"signals": signals, "page": page, "limit": limit}

# EAGER LOADING — avoid N+1 queries
from sqlalchemy.orm import joinedload

# ❌ BAD: N+1 query — one query per user's subscription
users = db.query(User).all()
for user in users:
    sub = user.subscription  # additional query for each user

# ✅ GOOD: single JOIN query
users = db.query(User)\
    .options(joinedload(User.subscription))\
    .all()

# DATE FILTERING — always use indexes
# ❌ BAD: full table scan
signals = db.query(Signal).filter(
    func.date(Signal.created_at) == date.today()
)

# ✅ GOOD: range filter uses (created_at) index
today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
signals = db.query(Signal).filter(
    Signal.created_at >= today_start,
    Signal.created_at < today_start + timedelta(days=1),
)
```

### Connection pooling configuration

```python
# db/session.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,           # connections to keep open
    max_overflow=20,        # extra connections allowed under load
    pool_timeout=30,        # seconds to wait for connection
    pool_recycle=3600,      # recycle connections every hour
    pool_pre_ping=True,     # verify connection is alive before use
    echo=not settings.is_production,  # SQL logging in development only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 3. API Response Targets

### Performance budgets — if slower, investigate

| Endpoint | Target (p95) | Notes |
|---|---|---|
| GET /health | <50ms | Cache everything |
| GET /search?q= | <200ms | Redis cache + DB full-text search |
| GET /signals | <300ms | Redis cache L1 signals |
| GET /signals/{symbol} | <200ms | Redis cache + single DB query |
| POST /auth/login | <500ms | bcrypt is intentionally slow |
| POST /auth/signup | <1000ms | bcrypt + email send |
| POST /analysis/start | <100ms | Just starts job, returns job_id |
| GET /analysis/stream/{id} | First event <2s | Data cleaning fast |
| GET /analysis/stream/{id} | Full report <15s | All 7 agents |
| GET /portfolio | <400ms | Live price fetch + DB |
| GET /accuracy/summary | <200ms | Redis cached 1hr |
| POST /billing/checkout | <2000ms | Paystack API call |
| POST /billing/webhook | <200ms | Return 200 fast, process async |

### Webhook response time is critical

```python
# Paystack retries webhooks if they don't get 200 within 10 seconds
# Process webhooks asynchronously — return 200 immediately

@router.post("/billing/webhook")
async def paystack_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    # Verify signature synchronously (fast — just a hash comparison)
    if not verify_paystack_signature(payload, signature):
        raise HTTPException(400, "Invalid signature")

    event = json.loads(payload)

    # Process asynchronously — DON'T await this
    background_tasks.add_task(process_webhook_async, event, payload)

    # Return 200 immediately — Paystack won't retry
    return Response(status_code=200)
```

---

## 4. Agent Pipeline Optimisation

### Token reduction patterns

```python
# PATTERN 1: Compress context before passing to expensive agents
# Don't pass raw data to Analyst — pass researcher's structured summary

# ❌ INEFFICIENT: pass all raw data to analyst
analyst_prompt = f"""
Raw prices: {raw_price_history}  # hundreds of lines
Raw news: {raw_news_articles}     # full article text
"""

# ✅ EFFICIENT: pass researcher's structured summary
analyst_prompt = f"""
Price trend: {state.research.price_history_summary}
Technical: {state.research.technical_analysis}
Key news: {state.research.news_headlines[:3]}  # top 3 headlines only
Macro: {state.macro.macro_summary}
"""

# PATTERN 2: max_tokens tuned per agent
# Researcher: 800 tokens (structured JSON output)
# Macro Agent: 600 tokens (shorter structured output)
# Analyst: 1200 tokens (reasoning chain needed)
# Critic: 1000 tokens (challenges list)
# Arbiter: 2500 tokens (two versions of report)

# PATTERN 3: Shared context — pass only what changed
# Macro context changes every 4 hours → cache and reuse
# Only refresh macro when: CBN/Fed meeting, inflation data release
async def get_macro_context(market: str) -> MacroOutput:
    cached = await redis_client.get(f"macro:{market}")
    if cached:
        return MacroOutput(**json.loads(cached))
    # Fresh fetch only when cache expired
    fresh = await fetch_macro_data(market)
    await redis_client.setex(f"macro:{market}", 14400, json.dumps(fresh.dict()))
    return fresh
```

### Timeout handling

```python
# Each agent has a timeout — never let one agent hang the pipeline
import asyncio

AGENT_TIMEOUTS = {
    "data_cleaning":     10,   # seconds — Python only, should be fast
    "researcher":        15,   # Groq is fast
    "macro_agent":       15,
    "regulatory_agent":  15,
    "analyst":           30,   # Gemini may be slower
    "critic":            25,
    "arbiter_writer":    45,   # longest — writing full report
}

async def run_agent_with_timeout(agent_fn, state: AgentState, agent_name: str) -> AgentState:
    timeout = AGENT_TIMEOUTS.get(agent_name, 30)
    try:
        return await asyncio.wait_for(agent_fn(state), timeout=timeout)
    except asyncio.TimeoutError:
        state.errors.append(f"{agent_name} timed out after {timeout}s")
        state.events.append({"type": "agent_error", "agent": agent_name,
                              "error": f"Timed out after {timeout}s"})
        return state   # Return partial state — don't crash pipeline
```

---

## 5. Frontend Performance

### Code splitting — every route lazy-loaded

```typescript
// App.tsx — lazy load every page
import { lazy, Suspense } from "react";

const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Analysis    = lazy(() => import("./pages/Analysis"));
const Accuracy    = lazy(() => import("./pages/Accuracy"));
const Portfolio   = lazy(() => import("./pages/Portfolio"));
const Billing     = lazy(() => import("./pages/Billing"));
const Admin       = lazy(() => import("./pages/Admin"));

// Each page only loads when navigated to — initial bundle stays small
// Target: <200KB initial JS bundle

// React Query config — intelligent caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   60 * 1000,     // 1 minute — don't refetch if data is fresh
      cacheTime:   5 * 60 * 1000, // 5 minutes — keep in memory
      refetchOnWindowFocus: false, // don't refetch just because user switched tabs
      retry: 2,                   // retry failed requests twice
    },
  },
});

// Debounce search to avoid hammering the API
// hooks/useStockSearch.ts
function useStockSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);  // 300ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchStocks(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
  });
}
```

### Chart performance

```typescript
// Use Recharts ResponsiveContainer — never hardcode dimensions
// Memoize chart data to prevent unnecessary re-renders

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

function PriceChart({ priceHistory }: { priceHistory: PricePoint[] }) {
  // Memoize — only recalculate when priceHistory changes
  const chartData = useMemo(() =>
    priceHistory.map(p => ({
      date: new Date(p.date).toLocaleDateString("en-NG", {day: "numeric", month: "short"}),
      price: p.close,
    })), [priceHistory]
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="price" stroke="#00C2A8" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 6. Scalability Path

### Current free infrastructure handles more than you think

| Users | Infra | Monthly Cost | Bottleneck |
|---|---|---|---|
| 0–100 | Render free + Supabase free + Vercel | $0 | None |
| 100–500 | Render Starter ($7) + Supabase free | $7 | Render cold starts |
| 500–2,000 | Render Standard ($25) + Supabase Pro ($25) | $50 | DB connections |
| 2,000–10,000 | Render Pro ($85) + Supabase Pro + Redis ($7) | $97 | API throughput |
| 10,000+ | AWS ECS + RDS + ElastiCache | $300+ | Custom scaling |

### What breaks first (in order)

1. **Render free tier** — spins down after 15min inactivity, 30s cold start. Fix: Render Starter ($7). Or: UptimeRobot pings every 5min to keep alive.
2. **Supabase free** — 500MB storage. Signals table grows fastest (~1KB per signal, 100+ daily = 3MB/month). Fix: archive signals older than 90 days to cold storage.
3. **Groq free tier** — 14,400 req/day. At 1,000 Pro users with 3 analyses/day, that's 3,000 analyses × 3 Groq calls = 9,000 calls/day. Close to limit. Fix: batch calls, improve cache hit rate.
4. **Upstash Redis free** — 10,000 req/day. Each analysis hits Redis ~10 times = 10,000 analyses/day limit. Fix: Upstash Pay-as-you-go ($0.20/100k requests).

### When to add a queue

```python
# Current: synchronous analysis pipeline
# Works fine for <100 concurrent users

# When you need a queue (>100 concurrent analyses):
# Add Celery + Redis as broker
# Analysis becomes: POST /analysis/start → returns job_id → client polls or SSE

# celery_app.py
from celery import Celery
celery = Celery(broker=settings.REDIS_URL, backend=settings.REDIS_URL)

@celery.task
def run_analysis_task(symbol: str, market: str, user_id: str):
    # Run the LangGraph pipeline
    # Store result in DB when complete
    # Send Telegram notification if user requested it
    pass
```

---

## Performance Monitoring

### What to log for performance tracking

```python
# Log these metrics — use them to identify bottlenecks

import time

async def timed_agent_call(agent_name: str, agent_fn, state):
    start = time.time()
    result = await agent_fn(state)
    duration_ms = int((time.time() - start) * 1000)

    log.info("agent_timing",
             agent=agent_name,
             duration_ms=duration_ms,
             tokens=result.tokens_used if hasattr(result, "tokens_used") else None,
             cache_hit=False)
    return result

# Dashboard metrics to track:
# - Average analysis time per agent
# - Cache hit rate (target: >75%)
# - Groq rate limit hits per day
# - Gemini cost per day
# - Failed analyses (should be <1%)
```

---

*StockSense PERFORMANCE.md — v1.0.0*
