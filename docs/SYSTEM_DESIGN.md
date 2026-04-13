# StockSense — SYSTEM_DESIGN.md
## System Design Reference for Engineers & Recruiters

> This document explains every architectural decision in StockSense.
> Written for technical interviews and engineering reviews.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [The Two-Layer Design](#2-the-two-layer-design)
3. [Multi-Agent Pipeline Design](#3-multi-agent-pipeline-design)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Database Design Decisions](#5-database-design-decisions)
6. [API Design](#6-api-design)
7. [Caching Architecture](#7-caching-architecture)
8. [Real-Time Streaming Design](#8-real-time-streaming-design)
9. [Payment Architecture](#9-payment-architecture)
10. [Security Design](#10-security-design)
11. [Infrastructure Design](#11-infrastructure-design)
12. [Key Engineering Trade-offs](#12-key-engineering-trade-offs)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STOCKSENSE PLATFORM                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  CLIENT TIER                                                  │  │
│  │  React 18 + TypeScript + TailwindCSS                         │  │
│  │  Deployed on Vercel — global CDN — free                      │  │
│  └─────────────────────────┬────────────────────────────────────┘  │
│                             │ HTTPS + JWT                           │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │  API TIER                                                     │  │
│  │  FastAPI (Python 3.11) — async — Render.com free             │  │
│  │  JWT auth · Rate limiting · Input validation · CORS          │  │
│  └──────┬───────────────────┬──────────────────┬────────────────┘  │
│         │                   │                  │                    │
│  ┌──────▼──────┐  ┌─────────▼───────┐  ┌──────▼──────────────┐   │
│  │  LAYER 1    │  │    LAYER 2      │  │  SERVICES           │   │
│  │  Scanner    │  │  Multi-Agent    │  │  Auth · Paystack    │   │
│  │  (GitHub    │  │  LangGraph      │  │  Telegram · Cache   │   │
│  │  Actions)   │  │  Pipeline       │  │  Accuracy Tracker   │   │
│  └──────┬──────┘  └─────────┬───────┘  └──────┬──────────────┘   │
│         │                   │                  │                    │
│  ┌──────▼───────────────────▼──────────────────▼────────────────┐  │
│  │  DATA TIER                                                    │  │
│  │  PostgreSQL (Supabase) — primary store                       │  │
│  │  Redis (Upstash) — cache + rate limit counters               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  EXTERNAL SERVICES                                                  │
│  Groq API · Gemini API · Telegram Bot · Paystack · Resend          │
└─────────────────────────────────────────────────────────────────────┘
```

### Why this architecture

Three clear tiers with single responsibilities. Client never touches the database. API tier owns all business logic. Data tier is swappable (Supabase → Neon → RDS with zero code changes — just a new DATABASE_URL).

---

## 2. The Two-Layer Design

StockSense has two completely separate analysis modes that share the same infrastructure:

```
LAYER 1 — AUTOMATED DAILY SCANNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger:   GitHub Actions cron (market open daily)
Model:     Groq llama-3.1-8b-instant (FREE)
Scope:     500+ stocks scanned automatically
Output:    Top picks sent to Telegram
Cost:      $0/day
Latency:   2-3 minutes total (batch processing)
Users:     All tiers (Free=3 picks, Pro=unlimited)

LAYER 2 — ON-DEMAND DEEP ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger:   User searches stock → clicks Deep Analysis
Model:     Groq (free) + Gemini Flash (paid)
Scope:     Single stock, full institutional report
Output:    Streamed report via SSE to dashboard
Cost:      ~$0.005 per analysis
Latency:   8-15 seconds (streamed progressively)
Users:     Pro (3/day) + Enterprise (unlimited)
```

### Why two layers instead of one

Layer 1 handles discovery — users don't know what to look at. Layer 2 handles depth — users who found something interesting want to understand it fully. Separating them means Layer 1 can run free forever while Layer 2 costs are only incurred when users actively request them. This is the correct cost model for a SaaS product.

---

## 3. Multi-Agent Pipeline Design

### The 7-Agent Investment Committee

```
USER QUERY: "Analyse Zenith Bank (NGX)"
│
▼
┌─────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR  (Python — zero LLM tokens)                       │
│  Parse intent · Check tier · Check budget · Route to market     │
└────────────────────────────┬────────────────────────────────────┘
                             │
▼
┌─────────────────────────────────────────────────────────────────┐
│  DATA CLEANING AGENT  (Python — zero LLM tokens)                │
│  NGX: detect stale prices · fix kobo/naira · score reliability  │
│  US:  validate OHLCV · check data freshness · compute RSI       │
│  Output: CleanedData with data_quality: HIGH/MEDIUM/LOW/STALE   │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │ PARALLEL         │ PARALLEL         │ PARALLEL
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  RESEARCHER      │ │  MACRO AGENT     │ │  REGULATORY      │
│  Groq 8b (FREE)  │ │  Groq 8b (FREE)  │ │  Groq 8b (FREE)  │
│                  │ │                  │ │                  │
│  Price history   │ │  CBN/Fed rates   │ │  NGX filings     │
│  RSI/MACD        │ │  Inflation/CPI   │ │  Insider trades  │
│  News headlines  │ │  Oil price       │ │  Announcements   │
│  Peer comparison │ │  USD/NGN rate    │ │  Compliance flags│
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         └──────────────────── │ ──────────────────┘
                               │ (all 3 complete)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  ANALYST AGENT  (Gemini 2.0 Flash — ~$0.0004)                  │
│  Synthesise all data → generate preliminary signal              │
│  Output: signal, score, price_target, reasoning_chain           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  CRITIC AGENT  (Gemini 2.0 Flash — ~$0.0004)                   │
│  Challenge every Analyst assumption aggressively                │
│  Output: counter_signal, challenges, risk_flags, data_gaps      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ARBITER + WRITER  (Gemini 2.5 Flash — ~$0.0039)               │
│  Resolve disagreement · Write professional + beginner reports   │
│  Output: final_signal, arbiter_reasoning, both reports          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  VALIDATOR  (Python — zero LLM tokens)                          │
│  Price target sanity · Schema validation · Banned phrases check │
│  Output: validated FinalReport or rejection with reason         │
└─────────────────────────────────────────────────────────────────┘
│
▼
STREAMED TO USER VIA SSE  (~8-15 seconds total)
```

### Why LangGraph specifically

LangGraph gives you three things other frameworks don't:

**1. Stateful checkpointing.** If the Analyst agent completes but the Critic times out, the pipeline resumes from the Analyst's output — it doesn't restart from scratch. This is critical for a pipeline that costs money per run.

**2. Native conditional routing.** `should_continue_to_analyst()` can inspect the cleaned data and decide: full pipeline, degraded pipeline, or serve cache. This logic lives in the graph definition, not scattered across agent functions.

**3. Parallel node execution.** `asyncio.gather()` runs Researcher + Macro + Regulatory simultaneously. LangGraph's state management ensures they write to separate fields without conflicts.

### Why the Arbiter pattern

Investment decisions benefit from adversarial reasoning. A single model told to "analyse this stock" will find a narrative that fits the data. Two models — one instructed to find the bull case, one the bear case — surface genuine tensions in the data. The Arbiter must explicitly resolve the disagreement and document why. This produces more reliable signals than single-model analysis and is architecturally demonstrable — you can show a recruiter the three separate outputs.

---

## 4. Data Flow Diagrams

### User searches for a stock

```
User types "Zenith" in search bar
        │
        │ 300ms debounce
        ▼
GET /search?q=zenith&limit=10
        │
        ├── Redis cache check: search:zenith (TTL 1hr)
        │   HIT  → return cached results instantly
        │   MISS ↓
        ▼
PostgreSQL full-text search on stocks table
(GIN index on to_tsvector(name || ' ' || symbol))
        │
        ▼
Return: [{symbol, name, exchange, market, latest_signal}]
        │
        ▼
User selects ZENITHB
        │
        ▼
Navigate to /stock/ZENITHB
        │
        ▼
GET /search/stock/ZENITHB
        │
        ├── Fetch stock metadata from DB
        ├── Fetch latest Layer 1 signal (if today)
        └── Return: {stock, signal, can_deep_analyse: bool}
```

### Deep analysis request

```
User clicks "Deep Analysis" on ZENITHB
        │
        ├── IF Free/Starter tier:
        │     Show UpgradeModal
        │     Paystack checkout initialised
        │     User pays → webhook → tier upgraded → analysis starts
        │
        └── IF Pro/Enterprise tier:
              POST /analysis/start {symbol: "ZENITHB", exchange: "NGX"}
                      │
                      ├── Check daily limit (Pro: 3/day)
                      ├── Check platform budget
                      ├── Check Redis cache: analysis:ng:ZENITHB
                      │     HIT + price_delta < 2% → return cached report
                      │     MISS or stale → continue
                      │
                      ▼
              Returns {job_id: "uuid"}
                      │
              Frontend connects to SSE:
              GET /analysis/stream/{job_id}?symbol=ZENITHB
                      │
                      ▼
              LangGraph pipeline runs (see agent diagram above)
              Events streamed as each agent completes
                      │
                      ▼
              Report stored in analysis_reports table
              Report cached in Redis (TTL 4hrs)
              Response: final FinalReport JSON
```

### Payment flow

```
User clicks "Upgrade to Pro"
        │
        ▼
POST /billing/checkout {plan: "pro", billing: "monthly"}
        │
        ▼
Paystack initialize transaction
Amount: ₦12,999 = 1,299,900 kobo (ALWAYS kobo)
Plan code: PLN_xxxxxxxxxx
Metadata: {user_id, plan, billing}
        │
        ▼
Returns {checkout_url, reference}
Frontend redirects to Paystack hosted page
        │
        ▼
User pays (card / bank transfer / USSD)
        │
        ├── callback_url → /billing?success=paystack
        │   (UX only — DO NOT activate tier here)
        │
        └── Paystack fires webhook → POST /billing/webhook
                    │
                    ├── Verify HMAC-SHA512 signature
                    ├── Check idempotency (gateway_event_id)
                    ├── Verify amount matches expected
                    │
                    ▼
            charge.success → UPDATE user.tier = 'pro'
            subscription.create → SAVE email_token (critical)
                    │
                    ▼
            Telegram: "Welcome to Pro! Your account is now active."
```

---

## 5. Database Design Decisions

### Why PostgreSQL over NoSQL

StockSense data is inherently relational:
- Users have subscriptions have payment events
- Signals are evaluated against signal_outcomes
- Portfolio holdings reference trades

NoSQL would require denormalising data across multiple collections and manually maintaining referential integrity. PostgreSQL gives us JOINs, foreign keys, transactions, and the `payment_events` table can have a `UNIQUE` constraint on `gateway_event_id` — the database itself enforces idempotency, not application code.

### Why UUID primary keys

Sequential integer IDs expose information:
- Attacker can enumerate users by guessing `/users/1`, `/users/2`
- Reveals total user count (competitive intelligence)
- Easier to iterate records in brute-force attacks

UUID v4 primary keys are random — no information leakage, non-guessable, safe to include in URLs.

### The payment_events table is append-only

```sql
-- payment_events is the financial audit log
-- NEVER UPDATE or DELETE rows in this table
-- Every payment event is recorded permanently
-- This gives you: dispute resolution, debugging, fraud detection
-- If something goes wrong with a payment, this table tells you exactly what happened

-- The UNIQUE constraint on gateway_event_id is the idempotency guarantee
-- The database rejects duplicate inserts — no application-level check needed
CREATE UNIQUE INDEX idx_payment_events_gateway_id
    ON payment_events(gateway_event_id);
```

### Indexes designed for actual query patterns

```sql
-- signals table: most common queries are by symbol+date and by market+score
CREATE INDEX idx_signals_symbol_date ON signals(symbol, created_at DESC);
CREATE INDEX idx_signals_market_score ON signals(market, score DESC, created_at DESC);

-- stocks table: search uses full-text index
CREATE INDEX idx_stocks_search ON stocks
    USING gin(to_tsvector('english', name || ' ' || symbol));

-- These indexes are not guesses — they match the exact WHERE clauses
-- in the most frequently called endpoints
```

---

## 6. API Design

### RESTful with predictable patterns

```
Resource naming:
GET    /signals              → list
GET    /signals/{symbol}     → single resource
POST   /signals              → create
PUT    /signals/{id}         → full update
DELETE /signals/{id}         → delete

Filtering via query params:
GET /signals?market=ng&signal=BUY&limit=10&page=2

Tier-based response shaping:
GET /signals → same endpoint, different data based on user.tier
Free:       returns 3 signals
Pro:        returns all signals
Enterprise: returns all signals + metadata
```

### Why SSE over WebSockets for streaming

WebSockets are bidirectional — you need them for chat, collaborative editing, games. The analysis stream is unidirectional: server pushes events, client only listens. SSE is simpler, works over HTTP/1.1, automatically reconnects, and goes through standard load balancers without special configuration. WebSockets require upgrade handling and stateful connections that complicate horizontal scaling.

```python
# SSE format — simple text protocol
# Each event: "data: {json}\n\n"
# Client: new EventSource('/analysis/stream/job-id')
# No library needed on the frontend
```

### Idempotency keys on write endpoints

```python
# Client sends: Idempotency-Key: uuid-per-request
# Server checks Redis: idem:{user_id}:{key}
# If found: return cached result (client retried)
# If not found: process + cache result for 24hrs
# Prevents duplicate trades if client retries on timeout
```

---

## 7. Caching Architecture

### Two-level cache

```
REQUEST
   │
   ├── Level 1: Redis (in-memory, milliseconds)
   │   Keys: signal:{market}:{symbol}, analysis:{market}:{symbol}
   │   TTL: 15min (prices) to 24hrs (regulatory data)
   │   Hit rate target: >75%
   │
   └── Level 2: PostgreSQL (disk, tens of milliseconds)
       Used when Redis cache expired
       Always source of truth
```

### Cache decision matrix for Layer 2

```python
price_delta = |current_price - cached_price| / cached_price

price_delta < 2%   → SERVE_CACHE     (zero AI calls, ~$0 cost)
price_delta 2-5%   → PARTIAL_REFRESH (re-run analyst+critic only)
price_delta > 5%   → FULL_FRESH      (all 7 agents)
signal flipped     → FULL_FRESH      (always, regardless of price)
cache_age > 8hrs   → FULL_FRESH      (stale regardless of price)
```

### Why this matters for cost

Without caching: 100 users analyse DANGCEM → 100 API calls → ~$0.50
With caching: 100 users analyse DANGCEM → 1 API call + 99 cache hits → ~$0.005

The cache is not a performance optimisation — it's the cost model.

---

## 8. Real-Time Streaming Design

### Why streaming matters for UX

Analysis takes 8-15 seconds. Without streaming, users see a blank screen for 15 seconds then a full report appears. With streaming, they see:

```
T+0s   ◈ Starting analysis for ZENITHB...
T+0.5s ✅ Data quality: HIGH · Price: ₦38.50
T+2s   ✅ Research complete · RSI=42, volume_ratio=1.4x
T+2.1s ✅ Macro analysis · CBN held at 27.25%
T+2.3s ✅ Regulatory · Director bought ₦45M shares
T+4s   ✅ Analyst: BUY 7.1/10
T+6s   ✅ Critic: 3 challenges raised
T+8s   ✅ Arbiter: BUY 6.6/10 — generating report...
T+9s   Report ready
```

This is the difference between a demo and a product.

### SSE vs Polling

```
POLLING (what most apps do):
Client → GET /analysis/status every 2 seconds
Problem: 15 requests to get one result, server load

SSE (what StockSense does):
Client → GET /analysis/stream (one connection, stays open)
Server → pushes events as they happen
Result: lower server load, instant updates, no unnecessary requests
```

---

## 9. Payment Architecture

### Why Paystack only (for now)

StockSense's primary market is Nigeria. Nigerian bank cards frequently decline on Stripe due to bank-side international transaction restrictions. Paystack is built for Nigerian banks — it natively supports local cards, bank transfer, and USSD. Starting with Paystack eliminates the #1 payment failure cause for Nigerian users.

Stripe can be added later for international users with a gateway selection UI.

### The email_token problem

Paystack subscriptions require an `email_token` to cancel via API. This token is sent once — in the `subscription.create` webhook. If you miss saving it, you cannot cancel the subscription programmatically — only via the Paystack Dashboard manually.

```python
# This is why subscription.create handler has this:
if not data.get("email_token"):
    log.error("CRITICAL: email_token missing",
              subscription_code=data.get("subscription_code"))
    # Alert admin immediately — manual intervention required
```

### Idempotency in payments

```python
# Payment events table has UNIQUE constraint on gateway_event_id
# This is the database-level idempotency guarantee

# Scenario: Paystack sends the same webhook twice (network retry)
# First call: INSERT into payment_events → succeeds
# Second call: INSERT into payment_events → IntegrityError (duplicate)
# Result: user charged once, tier updated once

# Without this: user could be upgraded twice, or subscription
# activated twice creating two records
```

---

## 10. Security Design

### JWT token architecture

```
Access Token (15 minutes):
- Stored in memory only (never localStorage)
- Contains: user_id, email, tier, exp
- Sent as: Authorization: Bearer {token}
- Short expiry limits damage if stolen

Refresh Token (30 days):
- Stored as HttpOnly cookie (JavaScript cannot read)
- Stored as SHA-256 hash in database (not the token itself)
- SameSite=Strict prevents CSRF
- Revocable: set revoked=True in DB

Why hash the refresh token in DB:
If database is compromised, attacker gets hashes
They cannot use hashes to authenticate
Attacker needs the raw token (only ever in the cookie)
```

### Defence in depth

```
Layer 1: Rate limiting (slowapi + Redis)
         5 login attempts / IP / 15 minutes
         Prevents brute force

Layer 2: Input validation (Pydantic v2)
         All inputs validated before any code runs
         SQLAlchemy ORM prevents SQL injection
         Prevents malformed data attacks

Layer 3: JWT verification middleware
         Every protected route checks token
         Checks is_active=True (banned users blocked)
         Checks is_verified=True (unverified users blocked)

Layer 4: Ownership checks
         Every user-owned resource filtered by user_id
         404 returned for both "not found" and "not yours"
         Prevents horizontal privilege escalation

Layer 5: Payment signature verification
         Every Paystack webhook verified with HMAC-SHA512
         Paystack IP allowlisting as defence-in-depth
         Amount verification before tier upgrade
```

---

## 11. Infrastructure Design

### Why free tier first

```
CURRENT (free):
Vercel      → Frontend hosting + CDN          $0
Render      → FastAPI backend                 $0
Supabase    → PostgreSQL database             $0
Upstash     → Redis cache                     $0
GitHub      → Actions scheduler               $0
Resend      → Transactional email             $0
Groq        → 3 AI agents                     $0
────────────────────────────────────────────
Total infrastructure:                         $0/month
```

The only cost is Gemini API for the Analyst+Critic+Arbiter agents — approximately $8-15/month at moderate usage. That's covered by just 1-2 Pro subscribers.

### Scalability breakpoints

```
0–500 users:     Current free stack handles this comfortably
500–2000 users:  Render Starter ($7) + Supabase Pro ($25) = $32/month
2000–10000 users: Render Standard ($25) + Supabase Pro ($25) = $50/month
10000+ users:    AWS ECS + RDS + ElastiCache = custom
```

### GitHub Actions as scheduler

The Layer 1 scanner has no always-on server requirement. GitHub Actions runs it at market open (9:35 AM ET for US, 10:05 AM WAT for NGX), completing in 2-3 minutes, then stops. Free tier gives 2,000 minutes/month — the scanner uses ~90 minutes/month. This is the correct architecture for a batch job.

---

## 12. Key Engineering Trade-offs

### Trade-off 1: Multiple models vs single model

**Chose:** Different model per agent (Groq free for data, Gemini for reasoning)
**Alternative:** Single model (e.g. Claude Sonnet) for everything
**Why:** 85% cost reduction. Groq's 8b model is sufficient for structured data extraction. Premium models are only needed for reasoning and report writing. The quality difference on data extraction tasks is negligible; the cost difference is enormous.

### Trade-off 2: LangGraph vs simple function chain

**Chose:** LangGraph with full state machine and checkpointing
**Alternative:** Sequential async function calls
**Why:** LangGraph adds resume-on-failure, conditional routing, and parallel execution. These aren't features for their own sake — they directly reduce cost (no re-running completed agents on failure) and improve UX (parallel agents cut latency by 45%). The complexity cost is real but justified.

### Trade-off 3: SSE vs WebSocket for streaming

**Chose:** Server-Sent Events (SSE)
**Alternative:** WebSocket
**Why:** Analysis stream is unidirectional (server to client). WebSockets add bidirectional complexity, stateful connection management, and load balancer configuration overhead for no benefit. SSE is HTTP — it works everywhere, reconnects automatically, and requires zero special infrastructure.

### Trade-off 4: Paystack only vs dual gateway

**Chose:** Paystack only initially
**Alternative:** Stripe + Paystack from day one
**Why:** Nigerian bank cards frequently fail on Stripe. Starting with Paystack eliminates the primary payment failure cause for the target market. Adding Stripe is additive — it doesn't require changing existing Paystack code.

### Trade-off 5: SQLite dev vs PostgreSQL everywhere

**Chose:** PostgreSQL (Supabase) even in development
**Alternative:** SQLite for dev, PostgreSQL for production
**Why:** SQLite and PostgreSQL have different behaviour for NULL handling, UNIQUE constraints, and certain query patterns. Running PostgreSQL in development catches bugs that only appear in production with SQLite. Supabase's free tier makes this cost-free.

---

*StockSense SYSTEM_DESIGN.md — v1.0.0*
