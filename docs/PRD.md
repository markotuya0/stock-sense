# StockSense — Complete Product Requirements Document
## For Claude (AI Assistant in VS Code)

> **Read this entire file before writing a single line of code.**
> This is the single source of truth for the StockSense platform.
> Every decision, every edge case, every file, every function is specified here.
> When in doubt — check this document first.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technical Stack — Exact Versions](#2-technical-stack)
3. [Project Structure — Every File](#3-project-structure)
4. [Database Schema — Complete](#4-database-schema)
5. [Environment Variables — Every One](#5-environment-variables)
6. [Layer 1 — Daily Scanner](#6-layer-1-daily-scanner)
7. [Layer 2 — Multi-Agent Research Analyst](#7-layer-2-multi-agent-research-analyst)
8. [Agent Definitions — All 7](#8-agent-definitions)
9. [LangGraph Graph Definition](#9-langgraph-graph-definition)
10. [FastAPI Backend — All Endpoints](#10-fastapi-backend)
11. [Authentication System](#11-authentication-system)
12. [Stock Search — Universal Discovery](#12-stock-search)
13. [Payment System — Paystack Only](#13-payment-system-paystack)
14. [Telegram Alert System](#14-telegram-alerts)
15. [React Frontend — All Pages](#15-react-frontend)
16. [Streaming — SSE Architecture](#16-streaming-sse)
17. [Caching Strategy](#17-caching-strategy)
18. [Signal Accuracy Tracker](#18-signal-accuracy-tracker)
19. [GitHub Actions — Scheduled Jobs](#19-github-actions)
20. [Deployment — Step by Step](#20-deployment)

---

## 1. Product Overview

### What StockSense Is

StockSense is a two-layer AI investment intelligence platform:

- **Layer 1** — Automated daily scanner. Runs at market open every weekday. Scans 500+ US and NGX stocks. Sends top picks via Telegram. Powered by Groq Llama 3.1-8b (free).
- **Layer 2** — Multi-agent research analyst. User searches any US or NGX stock, clicks "Deep Analysis", gets a full institutional-grade research report from a 7-agent LangGraph pipeline. Streamed progressively. Powered by mixed models (Groq free + Gemini Flash paid).

### User Flow — Stock Discovery to Payment

```
User lands on dashboard
  │
  ├── Search bar at top: "Search any US or NGX stock..."
  │     User types: "Zenith" or "AAPL" or "Dangote"
  │     Real-time autocomplete from our stocks table
  │     User selects: ZENITHB (Zenith Bank, NGX)
  │
  ├── Stock Detail Page loads
  │     Shows: price, chart, Layer 1 signal (if exists), company info
  │     Shows: "Deep Analysis" button
  │
  ├── User clicks "Deep Analysis"
  │     IF user is Free tier:
  │       Show upgrade modal: "Deep Analysis requires Pro"
  │       Show Paystack checkout for Pro (₦12,999/month)
  │       User pays → tier upgraded → analysis runs
  │     IF user is Pro/Enterprise:
  │       Analysis starts immediately
  │       Streaming progress panel shows agent updates
  │       Full report delivered in ~8-15 seconds
  │
  └── User reads report, sees both Analyst + Critic views,
      Arbiter recommendation, and decides their own position
```

### Tiers

| Feature | Free | Pro (₦12,999/mo) | Enterprise (₦49,999/mo) |
|---|---|---|---|
| Daily picks (Layer 1) | 3 picks | Unlimited | Unlimited |
| Weekly Telegram digest | ✅ | ✅ | ✅ |
| Daily Telegram briefing | ❌ | ✅ | ✅ |
| Real-time alerts | ❌ | ✅ | ✅ |
| Stock search (all US + NGX) | ✅ | ✅ | ✅ |
| Deep Analysis (Layer 2) | ❌ | 3/day | Unlimited |
| Agent debate view | ❌ | ✅ | ✅ |
| Earnings sentiment | ❌ | ✅ | ✅ |
| Macro cross-referencing | ❌ | ✅ | ✅ |
| Portfolio tracking | View only | Full P&L | Full + export |
| Signal accuracy dashboard | Public | Full history | Full + API |
| REST API | ❌ | ❌ | ✅ |
| Payment | — | Paystack NGN | Paystack NGN |

### Payment — Paystack Only (for now)

- Only Paystack. No Stripe yet.
- All prices in Nigerian Naira (NGN).
- Pro: ₦12,999/month or ₦116,999/year (save 25%)
- Enterprise: ₦49,999/month or ₦449,999/year
- Paystack handles: card, bank transfer, USSD, mobile money

---

## 2. Technical Stack

### Backend
```
Python                3.11+
FastAPI               0.115.0
SQLAlchemy            2.0.36
Alembic               1.14.0
Pydantic              2.10.0
pydantic-settings     2.7.0
python-jose           3.3.0
passlib[bcrypt]       1.7.4
httpx                 0.28.0
redis                 5.2.0
celery                5.4.0      # for background tasks
langgraph             0.2.60
langchain             0.3.0
langchain-google-genai 2.0.0
groq                  0.13.0
yfinance              0.2.50
pandas                2.2.0
ta                    0.11.0     # technical analysis library
beautifulsoup4        4.12.0
requests              2.32.0
python-telegram-bot   21.9
paystack              2.0.0      # unofficial Paystack Python SDK
structlog             24.4.0
python-dotenv         1.0.1
slowapi               0.1.9
pytest                8.3.0
pytest-asyncio        0.24.0
uvicorn               0.32.0
```

### Frontend
```
React                 18.3.0
TypeScript            5.7.0
Vite                  6.0.0
TailwindCSS           3.4.0
React Router          6.28.0
Zustand               5.0.0
@tanstack/react-query 5.62.0
Recharts              2.14.0
React Hook Form       7.54.0
Zod                   3.24.0
Axios                 1.7.0
Lucide React          0.468.0
```

### Infrastructure (all free)
```
Database:     Supabase (PostgreSQL 15, free 500MB)
Cache:        Upstash Redis (free 10k req/day)
API hosting:  Render.com (free 750hrs/month)
Frontend:     Vercel (free, unlimited)
Scheduler:    GitHub Actions (free 2000 min/month)
Emails:       Resend.com (free 3000/month)
Monitoring:   UptimeRobot (free)
```

### AI Models
```
Groq llama-3.1-8b-instant   → Researcher, Macro, Regulatory agents (FREE)
Groq llama-3.3-70b-versatile → Fallback for complex data extraction (FREE)
gemini-2.0-flash-exp         → Analyst + Critic agents (~$0.00039 per analysis)
gemini-2.5-flash-preview     → Arbiter + Writer agent (~$0.0039 per analysis)
Total per deep analysis:       ~$0.0047
```

---

## 3. Project Structure

```
stocksense/
│
├── .env                          # Never commit. All secrets here.
├── .env.example                  # Commit this. Placeholder values.
├── .gitignore
├── requirements.txt
├── alembic.ini
├── README.md
│
├── main.py                       # FastAPI app entry point
├── config.py                     # Pydantic Settings — validates all env vars on startup
├── models.py                     # Pydantic request/response schemas
│
├── agents/                       # LangGraph multi-agent system
│   ├── __init__.py
│   ├── state.py                  # AgentState dataclass — shared memory across all agents
│   ├── graph.py                  # LangGraph graph definition — wires all agents together
│   ├── orchestrator.py           # Query parser + router (no LLM)
│   ├── cleaning/
│   │   ├── __init__.py
│   │   ├── us_cleaner.py         # US stock data validation
│   │   └── ngx_cleaner.py        # NGX thin market specialist
│   ├── researcher.py             # Groq 8b — data enrichment
│   ├── macro_agent.py            # Groq 8b — macro context (CBN, Fed, oil, FX)
│   ├── regulatory_agent.py       # Groq 8b — filings, insider trades
│   ├── analyst_agent.py          # Gemini 2.0 Flash — signal generation
│   ├── critic_agent.py           # Gemini 2.0 Flash — challenge and debate
│   ├── arbiter_writer.py         # Gemini 2.5 Flash — final report
│   └── validator.py              # Pure Python sanity checks (no LLM)
│
├── scanner/                      # Layer 1 daily scanner
│   ├── __init__.py
│   ├── main.py                   # Entry point called by GitHub Actions
│   ├── us_scanner.py             # Fetch + prefilter US stocks (yfinance)
│   ├── ngx_scanner.py            # Fetch + prefilter NGX stocks (scraper)
│   ├── crypto_scanner.py         # Fetch crypto (CoinGecko)
│   └── daily_analyst.py          # Groq 8b signal generation for Layer 1
│
├── routers/                      # FastAPI routers — one file per domain
│   ├── __init__.py
│   ├── auth.py                   # /auth/*
│   ├── users.py                  # /users/*
│   ├── search.py                 # /search — universal stock search
│   ├── signals.py                # /signals/*
│   ├── analysis.py               # /analysis/* — Layer 2 deep analysis + SSE
│   ├── portfolio.py              # /portfolio/*
│   ├── alerts.py                 # /alerts/*
│   ├── billing.py                # /billing/* — Paystack only
│   ├── accuracy.py               # /accuracy/* — public signal tracker
│   ├── learn.py                  # /learn/* — financial literacy
│   └── admin.py                  # /admin/*
│
├── services/                     # Business logic — no HTTP, no direct DB
│   ├── __init__.py
│   ├── auth_service.py           # JWT, bcrypt, Google OAuth
│   ├── paystack_service.py       # Paystack checkout + webhook processing
│   ├── telegram_service.py       # Send alerts + format messages
│   ├── cache_service.py          # Redis wrapper + cache decision logic
│   ├── accuracy_service.py       # Signal outcome evaluation
│   ├── budget_service.py         # Per-user + platform spend tracking
│   ├── search_service.py         # Stock search + autocomplete logic
│   └── streaming_service.py      # SSE event management
│
├── db/
│   ├── __init__.py
│   ├── models.py                 # SQLAlchemy ORM table definitions
│   ├── crud.py                   # All DB operations — called by services only
│   ├── session.py                # Engine, SessionLocal, get_db dependency
│   └── migrations/               # Alembic migration files
│       └── versions/
│
├── middleware/
│   ├── __init__.py
│   ├── auth.py                   # JWT decode + user injection
│   ├── tier_guard.py             # Free/Pro/Enterprise access control
│   ├── rate_limit.py             # slowapi configuration
│   └── security_headers.py       # HSTS, CSP, X-Frame-Options
│
├── data/
│   ├── us_stocks.json            # Static list of S&P 500 + NASDAQ symbols for search
│   └── ngx_stocks.json           # Static list of all NGX listed symbols for search
│
├── .github/
│   └── workflows/
│       ├── daily_scan.yml        # Runs Layer 1 scanner daily
│       ├── accuracy_eval.yml     # Evaluates signal outcomes daily
│       └── deploy.yml            # Auto-deploy on push to main
│
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_search.py
│   ├── test_signals.py
│   ├── test_agents.py
│   ├── test_paystack.py
│   └── test_ngx_cleaner.py
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   ├── client.ts          # Axios instance with JWT interceptor
        │   ├── auth.ts
        │   ├── search.ts
        │   ├── signals.ts
        │   ├── analysis.ts
        │   └── billing.ts
        ├── store/
        │   ├── authStore.ts       # Zustand auth state
        │   └── analysisStore.ts   # Zustand analysis state
        ├── hooks/
        │   ├── useAnalysisStream.ts  # SSE hook
        │   └── useStockSearch.ts     # Debounced search hook
        ├── components/
        │   ├── SearchBar/
        │   │   ├── SearchBar.tsx
        │   │   └── SearchResults.tsx
        │   ├── SignalCard/
        │   │   └── SignalCard.tsx
        │   ├── AgentProgress/
        │   │   └── AgentProgress.tsx   # Live streaming panel
        │   ├── AnalysisReport/
        │   │   ├── AnalysisReport.tsx
        │   │   ├── ArbiterView.tsx
        │   │   ├── DebateView.tsx       # Analyst vs Critic
        │   │   └── BeginnerView.tsx
        │   ├── PortfolioWidget/
        │   │   └── PortfolioWidget.tsx
        │   ├── AccuracyChart/
        │   │   └── AccuracyChart.tsx
        │   └── UpgradeModal/
        │       └── UpgradeModal.tsx
        └── pages/
            ├── Landing.tsx
            ├── auth/
            │   ├── Signup.tsx
            │   ├── Login.tsx
            │   └── VerifyEmail.tsx
            ├── Dashboard.tsx
            ├── StockDetail.tsx       # Search result + analysis page
            ├── Portfolio.tsx
            ├── Alerts.tsx
            ├── Learn.tsx
            ├── Billing.tsx
            ├── Accuracy.tsx          # Public signal accuracy dashboard
            ├── Settings.tsx
            └── Admin.tsx
```

---

## 4. Database Schema

### Complete SQL — run in order

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                TEXT UNIQUE NOT NULL,
    password_hash        TEXT,                    -- NULL for Google-only accounts
    google_id            TEXT UNIQUE,             -- NULL for email accounts
    full_name            TEXT,
    avatar_url           TEXT,
    tier                 TEXT NOT NULL DEFAULT 'free'
                         CHECK (tier IN ('free', 'pro', 'enterprise', 'admin')),
    is_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    telegram_chat_id     TEXT,
    telegram_username    TEXT,
    risk_profile         TEXT NOT NULL DEFAULT 'balanced'
                         CHECK (risk_profile IN ('conservative', 'balanced', 'aggressive')),
    timezone             TEXT NOT NULL DEFAULT 'Africa/Lagos',
    country              TEXT DEFAULT 'NG',
    paystack_customer_id TEXT,
    deep_analyses_today  INTEGER NOT NULL DEFAULT 0,
    analyses_reset_at    DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at        TIMESTAMPTZ,
    last_seen_at         TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);

-- ── AUTH TOKENS ───────────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

CREATE TABLE email_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    purpose     TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
    id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                    UUID NOT NULL REFERENCES users(id),
    paystack_subscription_code TEXT UNIQUE,
    paystack_customer_code     TEXT,
    paystack_email_token       TEXT,     -- CRITICAL: required to cancel via API
    plan                       TEXT NOT NULL CHECK (plan IN ('pro', 'enterprise')),
    currency                   TEXT NOT NULL DEFAULT 'NGN',
    amount                     NUMERIC(12, 2) NOT NULL,
    status                     TEXT NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    current_period_start       TIMESTAMPTZ,
    current_period_end         TIMESTAMPTZ,
    cancel_at_period_end       BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at               TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscriptions_active_user
    ON subscriptions(user_id) WHERE status = 'active';
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- ── PAYMENT EVENTS (immutable audit log) ─────────────────────────────────────
CREATE TABLE payment_events (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES users(id),
    gateway           TEXT NOT NULL DEFAULT 'paystack',
    event_type        TEXT NOT NULL,   -- payment.success, payment.failed, subscription.cancelled, refund
    gateway_event_id  TEXT UNIQUE NOT NULL,   -- Paystack reference — prevents duplicate processing
    amount            NUMERIC(12, 2),
    currency          TEXT DEFAULT 'NGN',
    status            TEXT,
    raw_payload       JSONB,           -- full webhook payload for debugging
    processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- This table is APPEND ONLY. Never UPDATE or DELETE rows.

CREATE UNIQUE INDEX idx_payment_events_gateway_id ON payment_events(gateway_event_id);

-- ── STOCKS (search index) ─────────────────────────────────────────────────────
CREATE TABLE stocks (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol       TEXT NOT NULL,
    name         TEXT NOT NULL,
    exchange     TEXT NOT NULL CHECK (exchange IN ('NYSE', 'NASDAQ', 'NGX')),
    market       TEXT NOT NULL CHECK (market IN ('us', 'ng')),
    sector       TEXT,
    currency     TEXT NOT NULL DEFAULT 'USD',
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_stocks_symbol_exchange ON stocks(symbol, exchange);
CREATE INDEX idx_stocks_search ON stocks USING gin(to_tsvector('english', name || ' ' || symbol));
CREATE INDEX idx_stocks_market ON stocks(market);

-- ── LAYER 1 SIGNALS ───────────────────────────────────────────────────────────
CREATE TABLE signals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol          TEXT NOT NULL,
    company_name    TEXT,
    market          TEXT NOT NULL CHECK (market IN ('us', 'ng', 'crypto')),
    exchange        TEXT,
    signal          TEXT NOT NULL CHECK (signal IN ('STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL')),
    score           NUMERIC(4, 2) NOT NULL CHECK (score >= 0.1 AND score <= 9.9),
    price           NUMERIC(15, 4) NOT NULL,
    price_target    NUMERIC(15, 4),
    upside_pct      NUMERIC(8, 4),
    sentiment       TEXT CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
    risk_score      INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
    data_quality    TEXT CHECK (data_quality IN ('HIGH', 'MEDIUM', 'LOW', 'STALE')),
    confidence      NUMERIC(4, 3),
    reason          TEXT,
    beginner_note   TEXT,
    learn_term      TEXT,
    rsi             NUMERIC(6, 3),
    macd            NUMERIC(10, 6),
    volume          NUMERIC(20, 2),
    volume_ratio    NUMERIC(8, 4),
    warnings        JSONB DEFAULT '[]',
    layer           INTEGER NOT NULL DEFAULT 1 CHECK (layer IN (1, 2)),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_symbol_date ON signals(symbol, created_at DESC);
CREATE INDEX idx_signals_market_score ON signals(market, score DESC, created_at DESC);
CREATE INDEX idx_signals_created ON signals(created_at DESC);
CREATE INDEX idx_signals_layer ON signals(layer);

-- ── LAYER 2 DEEP ANALYSIS REPORTS ────────────────────────────────────────────
CREATE TABLE analysis_reports (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES users(id),
    symbol               TEXT NOT NULL,
    market               TEXT NOT NULL,
    -- Final arbiter output
    final_signal         TEXT NOT NULL,
    final_score          NUMERIC(4, 2),
    price_at_analysis    NUMERIC(15, 4),
    data_quality         TEXT,
    -- Agent outputs (stored as JSONB for flexibility)
    researcher_output    JSONB,
    macro_output         JSONB,
    regulatory_output    JSONB,
    analyst_output       JSONB,     -- includes signal, score, reasoning
    critic_output        JSONB,     -- includes counter-signal, challenges
    arbiter_output       JSONB,     -- includes final decision + reasoning
    -- Report text
    professional_report  TEXT,      -- 500-word professional version
    beginner_report      TEXT,      -- 150-word plain English version
    -- Metadata
    was_disputed         BOOLEAN DEFAULT FALSE,   -- analyst vs critic disagreed
    agent_versions       JSONB,     -- which model versions were used
    total_tokens_used    INTEGER,
    cost_usd             NUMERIC(10, 6),
    processing_time_ms   INTEGER,
    cache_hit            BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON analysis_reports(user_id, created_at DESC);
CREATE INDEX idx_reports_symbol ON analysis_reports(symbol, created_at DESC);

-- ── PORTFOLIO ─────────────────────────────────────────────────────────────────
CREATE TABLE portfolio_holdings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    market      TEXT NOT NULL,
    shares      NUMERIC(20, 8) NOT NULL CHECK (shares > 0),
    avg_cost    NUMERIC(15, 4) NOT NULL CHECK (avg_cost > 0),
    currency    TEXT NOT NULL DEFAULT 'NGN',
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, symbol)
);

CREATE TABLE trades (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    market      TEXT NOT NULL,
    action      TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
    quantity    NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
    price       NUMERIC(15, 4) NOT NULL CHECK (price > 0),
    fee         NUMERIC(12, 4) NOT NULL DEFAULT 0,
    platform    TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes       TEXT
);

CREATE INDEX idx_trades_user ON trades(user_id, executed_at DESC);

-- ── WATCHLISTS ────────────────────────────────────────────────────────────────
CREATE TABLE watchlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    market      TEXT NOT NULL,
    exchange    TEXT,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, symbol)
);

-- ── PRICE ALERTS ──────────────────────────────────────────────────────────────
CREATE TABLE price_alerts (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol       TEXT NOT NULL,
    market       TEXT NOT NULL,
    condition    TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    target_price NUMERIC(15, 4) NOT NULL CHECK (target_price > 0),
    currency     TEXT NOT NULL DEFAULT 'NGN',
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ALERT LOG ─────────────────────────────────────────────────────────────────
CREATE TABLE alert_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    channel         TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'push')),
    alert_type      TEXT NOT NULL,
    message_preview TEXT,
    status          TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
    error_message   TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SCAN RUNS ─────────────────────────────────────────────────────────────────
CREATE TABLE scan_runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market              TEXT NOT NULL,
    layer               INTEGER NOT NULL,
    assets_scanned      INTEGER,
    candidates_found    INTEGER,
    signals_generated   INTEGER,
    started_at          TIMESTAMPTZ NOT NULL,
    finished_at         TIMESTAMPTZ,
    duration_seconds    INTEGER,
    status              TEXT NOT NULL CHECK (status IN ('running', 'complete', 'failed', 'skipped')),
    error_message       TEXT
);

-- ── SIGNAL ACCURACY ───────────────────────────────────────────────────────────
CREATE TABLE signal_outcomes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id        UUID REFERENCES signals(id),
    symbol           TEXT NOT NULL,
    market           TEXT NOT NULL,
    signal_type      TEXT NOT NULL,
    score            NUMERIC(4, 2),
    confidence       NUMERIC(4, 3),
    data_quality     TEXT,
    layer            INTEGER,
    price_at_signal  NUMERIC(15, 4),
    generated_at     TIMESTAMPTZ NOT NULL,
    evaluated_at     TIMESTAMPTZ,
    price_at_eval    NUMERIC(15, 4),
    price_change_pct NUMERIC(8, 4),
    outcome          TEXT CHECK (outcome IN ('CORRECT', 'INCORRECT', 'NEUTRAL', 'PENDING'))
                     DEFAULT 'PENDING',
    evaluation_days  INTEGER DEFAULT 30
);

CREATE INDEX idx_outcomes_symbol ON signal_outcomes(symbol);
CREATE INDEX idx_outcomes_market ON signal_outcomes(market);
CREATE INDEX idx_outcomes_outcome ON signal_outcomes(outcome);
```

---

## 5. Environment Variables

### `.env.example` — commit this file

```bash
# ── AI MODELS ──────────────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ── TELEGRAM ───────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=XXXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TELEGRAM_ADMIN_CHAT_ID=XXXXXXXXXX   # Your personal chat ID for admin alerts

# ── PAYSTACK ───────────────────────────────────────────────────────────────────
PAYSTACK_SECRET_KEY=sk_XXXXXXXX_YOUR_SECRET_KEY
PAYSTACK_PUBLIC_KEY=pk_XXXXXXXX_YOUR_PUBLIC_KEY
PAYSTACK_PRO_PLAN_CODE=PLN_XXXXXXXXXX          # from Paystack Dashboard > Plans
PAYSTACK_ENTERPRISE_PLAN_CODE=PLN_XXXXXXXXXX
PAYSTACK_PRO_ANNUAL_PLAN_CODE=PLN_XXXXXXXXXX
PAYSTACK_ENTERPRISE_ANNUAL_PLAN_CODE=PLN_XXXXXXXXXX
PAYSTACK_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # not used for sig but stored

# ── DATABASE ───────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres

# ── REDIS ──────────────────────────────────────────────────────────────────────
REDIS_URL=rediss://default:PASSWORD@XXXXX.upstash.io:6380

# ── AUTH ───────────────────────────────────────────────────────────────────────
SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # 64 char hex
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# ── EMAIL ──────────────────────────────────────────────────────────────────────
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FROM_EMAIL=noreply@stocksense.app

# ── APP ────────────────────────────────────────────────────────────────────────
ENVIRONMENT=development           # development | production
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8000
SCAN_MARKETS=us,ng
TIMEZONE=Africa/Lagos
TOP_PICKS_FREE=3
TOP_PICKS_PRO=999
DEEP_ANALYSES_FREE_DAILY=0
DEEP_ANALYSES_PRO_DAILY=3
DEEP_ANALYSES_ENTERPRISE_DAILY=999

# ── BUDGET GUARDS ──────────────────────────────────────────────────────────────
BUDGET_PER_ANALYSIS_MAX_TOKENS=15000
BUDGET_PER_USER_DAILY_USD=0.05
BUDGET_PLATFORM_DAILY_USD=10.00
BUDGET_PLATFORM_MONTHLY_USD=100.00

# ── GOOGLE OAUTH (optional) ────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=XXXXXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-XXXXXXXXXXXXXXXXXXXXXXXX
```

### `config.py` — validates all vars on startup

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # AI
    GROQ_API_KEY: str
    GOOGLE_API_KEY: str

    # Telegram
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_ADMIN_CHAT_ID: str

    # Paystack
    PAYSTACK_SECRET_KEY: str
    PAYSTACK_PUBLIC_KEY: str
    PAYSTACK_PRO_PLAN_CODE: str
    PAYSTACK_ENTERPRISE_PLAN_CODE: str
    PAYSTACK_PRO_ANNUAL_PLAN_CODE: str
    PAYSTACK_ENTERPRISE_ANNUAL_PLAN_CODE: str

    # Database
    DATABASE_URL: str
    REDIS_URL: str

    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Email
    RESEND_API_KEY: str
    FROM_EMAIL: str

    # App
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str
    API_URL: str
    SCAN_MARKETS: str = "us,ng"
    TIMEZONE: str = "Africa/Lagos"
    TOP_PICKS_FREE: int = 3
    TOP_PICKS_PRO: int = 999
    DEEP_ANALYSES_FREE_DAILY: int = 0
    DEEP_ANALYSES_PRO_DAILY: int = 3
    DEEP_ANALYSES_ENTERPRISE_DAILY: int = 999

    # Budget
    BUDGET_PER_ANALYSIS_MAX_TOKENS: int = 15000
    BUDGET_PER_USER_DAILY_USD: float = 0.05
    BUDGET_PLATFORM_DAILY_USD: float = 10.00
    BUDGET_PLATFORM_MONTHLY_USD: float = 100.00

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def scan_markets_list(self) -> list[str]:
        return [m.strip() for m in self.SCAN_MARKETS.split(",")]

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

---

## 6. Layer 1 — Daily Scanner

### How It Works

1. GitHub Actions triggers at market open (9:35 AM ET for US, 10:05 AM WAT for NGX)
2. `scanner/main.py` runs as a standalone script
3. Fetches 500+ stocks → pre-filters to 15-25 candidates
4. Sends each candidate to Groq for signal generation
5. Stores signals in database
6. Sends Telegram morning briefing to all active users

### `scanner/us_scanner.py`

```python
import yfinance as yf
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD
from datetime import datetime, timedelta
import structlog
from typing import Optional

log = structlog.get_logger()

SP500_SYMBOLS = []  # loaded from data/us_stocks.json at startup

class USScanner:
    MIN_PRICE = 1.0
    MIN_VOLUME_RATIO = 0.5    # today volume >= 50% of 20-day avg
    MIN_PRICE_CHANGE = 1.5    # price moved at least 1.5% today

    def scan(self) -> list[dict]:
        """Fetch all US stocks and return pre-filtered candidates."""
        log.info("Starting US scan", symbols=len(SP500_SYMBOLS))
        candidates = []

        # Fetch in batches of 50 to avoid rate limits
        for batch in self._batches(SP500_SYMBOLS, 50):
            batch_data = self._fetch_batch(batch)
            for stock in batch_data:
                if self._passes_prefilter(stock):
                    candidates.append(stock)

        log.info("US prefilter complete", candidates=len(candidates))
        return candidates

    def _fetch_batch(self, symbols: list[str]) -> list[dict]:
        results = []
        for symbol in symbols:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="60d")
                if hist.empty or len(hist) < 5:
                    continue

                today = hist.iloc[-1]
                prev = hist.iloc[-2]

                # Technical indicators
                rsi = self._compute_rsi(hist["Close"])
                macd_val = self._compute_macd(hist["Close"])

                # Volume ratio vs 20-day average
                vol_20d_avg = hist["Volume"].tail(20).mean()
                vol_ratio = today["Volume"] / vol_20d_avg if vol_20d_avg > 0 else 0

                results.append({
                    "symbol": symbol,
                    "price": float(today["Close"]),
                    "change_pct": float((today["Close"] - prev["Close"]) / prev["Close"] * 100),
                    "volume": float(today["Volume"]),
                    "volume_ratio": float(vol_ratio),
                    "rsi": float(rsi) if rsi else None,
                    "macd": float(macd_val) if macd_val else None,
                    "high_52w": float(hist["High"].max()),
                    "low_52w": float(hist["Low"].min()),
                    "market": "us",
                    "currency": "USD",
                    "fetched_at": datetime.utcnow().isoformat(),
                    "data_quality": "HIGH",
                })
            except Exception as e:
                log.warning("Failed to fetch stock", symbol=symbol, error=str(e))
                continue

        return results

    def _passes_prefilter(self, stock: dict) -> bool:
        if stock["price"] < self.MIN_PRICE:
            return False
        if abs(stock["change_pct"]) < self.MIN_PRICE_CHANGE:
            return False
        if stock["volume_ratio"] < self.MIN_VOLUME_RATIO:
            return False
        return True

    def _compute_rsi(self, close: pd.Series) -> Optional[float]:
        if len(close) < 14:
            return None
        rsi = RSIIndicator(close=close, window=14)
        values = rsi.rsi()
        return values.iloc[-1] if not values.empty else None

    def _compute_macd(self, close: pd.Series) -> Optional[float]:
        if len(close) < 26:
            return None
        macd = MACD(close=close)
        values = macd.macd()
        return values.iloc[-1] if not values.empty else None

    def _batches(self, lst: list, n: int):
        for i in range(0, len(lst), n):
            yield lst[i:i + n]
```

### `scanner/ngx_scanner.py`

```python
import requests
from bs4 import BeautifulSoup
import time
import structlog
from datetime import datetime

log = structlog.get_logger()

NGX_BASE_URL = "https://ngxgroup.com/exchange/data/equities-price-list/"

class NGXScanner:
    POLITE_DELAY = 2.0     # seconds between requests
    MIN_PRICE_NGN = 10.0   # minimum ₦10
    MIN_PRICE_CHANGE = 1.0 # 1% minimum move on NGX (lower threshold — thin market)

    def scan(self) -> list[dict]:
        """Scrape NGX price list and return pre-filtered candidates."""
        log.info("Starting NGX scan")
        raw_stocks = self._scrape_ngx()
        cleaned = [self._clean_ngx_stock(s) for s in raw_stocks if s]
        cleaned = [s for s in cleaned if s is not None]
        candidates = [s for s in cleaned if self._passes_prefilter(s)]
        log.info("NGX scan complete", total=len(raw_stocks), candidates=len(candidates))
        return candidates

    def _scrape_ngx(self) -> list[dict]:
        """Scrape NGX daily price list. Polite scraping with delays."""
        try:
            time.sleep(self.POLITE_DELAY)
            headers = {"User-Agent": "StockSense Research Bot 1.0"}
            response = requests.get(NGX_BASE_URL, headers=headers, timeout=30)
            response.raise_for_status()
            return self._parse_ngx_table(response.text)
        except Exception as e:
            log.error("NGX scrape failed", error=str(e))
            return []

    def _parse_ngx_table(self, html: str) -> list[dict]:
        """Parse HTML table from NGX website."""
        soup = BeautifulSoup(html, "html.parser")
        stocks = []
        # Parse the equity price list table
        # NOTE: NGX changes their HTML structure occasionally — monitor this
        table = soup.find("table", {"class": "table"})
        if not table:
            log.warning("NGX table not found — HTML structure may have changed")
            return []

        rows = table.find_all("tr")[1:]  # skip header
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 6:
                continue
            try:
                stocks.append({
                    "symbol": cells[0].text.strip(),
                    "name": cells[1].text.strip(),
                    "close": cells[2].text.strip().replace(",", ""),
                    "open": cells[3].text.strip().replace(",", ""),
                    "change": cells[4].text.strip().replace(",", ""),
                    "volume": cells[5].text.strip().replace(",", ""),
                })
            except (IndexError, AttributeError):
                continue
        return stocks

    def _clean_ngx_stock(self, raw: dict) -> dict | None:
        """Apply NGX-specific data cleaning. See SECURITY.md for full logic."""
        try:
            price = float(raw["close"])

            # CRITICAL: Detect kobo vs Naira confusion
            # NGX equity prices should never be above ₦10,000 in normal circumstances
            if price > 10_000:
                log.warning("Possible kobo unit detected", symbol=raw["symbol"], price=price)
                price /= 100

            change_str = raw.get("change", "0").replace("%", "")
            change_pct = float(change_str) if change_str else 0.0

            volume = float(raw.get("volume", "0").replace(",", "")) if raw.get("volume") else 0

            return {
                "symbol": raw["symbol"],
                "name": raw.get("name", raw["symbol"]),
                "price": price,
                "change_pct": change_pct,
                "volume": volume,
                "volume_ratio": 1.0,  # NGX doesn't provide historical volume easily
                "rsi": None,          # calculated separately from historical data
                "macd": None,
                "high_52w": None,
                "low_52w": None,
                "market": "ng",
                "currency": "NGN",
                "fetched_at": datetime.utcnow().isoformat(),
                "data_quality": "MEDIUM",  # default for NGX — upgraded after cleaning checks
            }
        except (ValueError, KeyError) as e:
            log.warning("Failed to clean NGX stock", raw=raw, error=str(e))
            return None

    def _passes_prefilter(self, stock: dict) -> bool:
        if stock["price"] < self.MIN_PRICE_NGN:
            return False
        if abs(stock["change_pct"]) < self.MIN_PRICE_CHANGE:
            return False
        return True
```

---

## 7. Layer 2 — Multi-Agent Research Analyst

### `agents/state.py` — Shared Agent State

```python
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

@dataclass
class StockInput:
    symbol: str
    exchange: str           # NYSE, NASDAQ, NGX
    market: str             # us, ng
    user_id: str
    user_tier: str
    analysis_depth: str = "deep"   # deep | quick

@dataclass
class CleanedData:
    symbol: str
    market: str
    price: float
    change_pct: float
    volume: Optional[float]
    volume_ratio: Optional[float]
    rsi: Optional[float]
    macd: Optional[float]
    high_52w: Optional[float]
    low_52w: Optional[float]
    currency: str
    data_quality: str          # HIGH, MEDIUM, LOW, STALE
    reliability_score: int     # 0-100
    warnings: list[str]
    fetched_at: datetime

@dataclass
class ResearchOutput:
    symbol: str
    price_history_summary: str
    technical_analysis: str
    news_headlines: list[dict]    # [{title, source, url, date}]
    peer_comparison: str
    sector_context: str
    verified_facts: list[dict]    # [{claim, source, value}] — for hallucination tracking

@dataclass
class MacroOutput:
    relevant_macro_factors: str
    interest_rate_context: str    # CBN rate for NGX, Fed rate for US
    currency_context: str         # USD/NGN rate, inflation
    sector_headwinds: str
    sector_tailwinds: str

@dataclass
class RegulatoryOutput:
    recent_filings: list[dict]
    insider_transactions: list[dict]  # [{name, action, amount, date}]
    material_announcements: list[str]
    compliance_flags: list[str]

@dataclass
class AnalystOutput:
    signal: str             # STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
    score: float            # 0.1–9.9
    price_target: float
    upside_pct: float
    sentiment: str          # POSITIVE, NEUTRAL, NEGATIVE
    risk_score: int         # 1–10
    confidence: float       # 0.1–0.99
    reasoning_chain: str    # step-by-step reasoning
    key_bulls: list[str]    # top 3 bull arguments
    key_risks: list[str]    # top 3 risk factors

@dataclass
class CriticOutput:
    counter_signal: str
    confidence_adjustment: float    # negative = reduces analyst confidence
    challenges: list[str]           # each challenge to analyst's arguments
    data_gaps: list[str]            # missing data that limits analysis
    risk_flags: list[str]           # specific risks analyst may have underweighted

@dataclass
class ArbiterOutput:
    final_signal: str
    final_score: float
    arbiter_reasoning: str
    resolution: str              # why arbiter sided with analyst or critic
    dissent_noted: str           # what the losing argument said (still shown to user)
    professional_report: str     # 500-word professional analysis
    beginner_report: str         # 150-word plain English for new investors
    learn_term: str              # one financial term explained simply

@dataclass
class AgentState:
    # Input
    input: Optional[StockInput] = None

    # Agent outputs (populated as pipeline runs)
    cleaned_data: Optional[CleanedData] = None
    research: Optional[ResearchOutput] = None
    macro: Optional[MacroOutput] = None
    regulatory: Optional[RegulatoryOutput] = None
    analyst: Optional[AnalystOutput] = None
    critic: Optional[CriticOutput] = None
    arbiter: Optional[ArbiterOutput] = None

    # Pipeline metadata
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    events: list[dict] = field(default_factory=list)   # SSE events emitted
    tokens_used: int = 0
    cost_usd: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
```

---

## 8. Agent Definitions

### System Prompts — Exact Text

#### Researcher Agent System Prompt
```
You are the Researcher Agent for StockSense AI. Your role is data enrichment, not analysis.

Your ONLY job: Extract and structure the factual information provided. Do not form opinions or predictions.

Rules:
1. Return ONLY the JSON schema specified. No prose before or after.
2. Every fact you include must come from the data provided to you. Never invent data.
3. For news summaries: extract factual content only, no interpretation.
4. If data is missing for a field, use null — never guess.

Return this JSON:
{
  "price_history_summary": "string — 2 sentences describing price trend from data",
  "technical_analysis": "string — RSI/MACD status in plain terms",
  "news_headlines": [{"title": "string", "source": "string", "sentiment": "positive|neutral|negative"}],
  "peer_comparison": "string — how this stock compares to sector peers if data available",
  "sector_context": "string — sector trends from data provided",
  "verified_facts": [{"claim": "string", "value": "string", "source": "string"}],
  "data_completeness": "HIGH|MEDIUM|LOW"
}
```

#### Macro Agent System Prompt
```
You are the Macro Context Agent for StockSense AI.

Your job: Contextualise the stock against the macroeconomic environment. Use ONLY the macro data provided.

For Nigerian (NGX) stocks, prioritise:
- CBN monetary policy rate
- Nigeria inflation (CPI)
- USD/NGN exchange rate
- Oil price (Brent crude)
- Nigeria-specific sector regulations

For US stocks, prioritise:
- Federal Reserve rate
- US CPI and PCE
- US dollar strength (DXY)
- Sector-specific macro factors

Rules:
1. Return ONLY the JSON schema below.
2. Only reference macro data explicitly provided — never invent figures.
3. Be specific: "CBN held at 27.25%" not "interest rates are high".

Return this JSON:
{
  "interest_rate_context": "string",
  "inflation_context": "string",
  "currency_context": "string",
  "oil_price_context": "string or null if not relevant",
  "sector_headwinds": ["string"],
  "sector_tailwinds": ["string"],
  "macro_overall_sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "macro_summary": "string — 2 sentences max"
}
```

#### Analyst Agent System Prompt
```
You are the Analyst Agent for StockSense AI. You generate the preliminary investment signal.

Your job: Synthesise the Researcher, Macro, and Regulatory outputs into a single investment signal with clear reasoning.

ABSOLUTE RULES — never break these:
1. ONLY use facts from the provided context. Never invent earnings figures, price targets, or news.
2. Price target must be within realistic bounds: never >100% above or >60% below current price.
3. score must be 0.1–9.9. Never use 10.0.
4. confidence must be 0.1–0.99. Scale it with data quality.
5. If data_quality is LOW, score must be ≤5.5 and signal must be BUY or SELL (not STRONG).
6. Use hedged language: "suggests", "indicates", "may" — never "will" or "guaranteed".

Return ONLY this JSON:
{
  "signal": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "score": float,
  "price_target": float,
  "upside_pct": float,
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "risk_score": int,
  "confidence": float,
  "reasoning_chain": "string — step by step, reference specific data points",
  "key_bulls": ["string", "string", "string"],
  "key_risks": ["string", "string", "string"]
}
```

#### Critic Agent System Prompt
```
You are the Critic Agent for StockSense AI. You challenge the Analyst's recommendation.

Your job: Play devil's advocate. Find every weakness in the Analyst's argument. Be thorough and specific.

Rules:
1. You MUST disagree or substantially qualify — never just say the Analyst is correct.
2. Challenge specific claims: "The Analyst cited X but failed to consider Y."
3. Identify data gaps that limit the analysis.
4. If Analyst says BUY, argue for HOLD or SELL. If SELL, argue for HOLD or BUY.
5. Be specific, not vague. "Currency devaluation risk of 15% could eliminate the upside" not "there are risks".

Return ONLY this JSON:
{
  "counter_signal": "BUY|HOLD|SELL",
  "confidence_adjustment": float,  // negative number: -0.2 means reduce analyst confidence by 20%
  "challenges": ["string", "string", "string"],
  "data_gaps": ["string"],
  "risk_flags": ["string"],
  "strongest_counter_argument": "string — the single best argument against the Analyst"
}
```

#### Arbiter + Writer Agent System Prompt
```
You are the Arbiter and Writer Agent for StockSense AI.

You receive the Analyst's BUY argument and the Critic's counter-argument. Your job has two parts:

PART 1 — ARBITRATE:
Read both arguments carefully. Weigh each against the verified data. Make a final decision.
You must explain WHY you sided with one view. Document the dissent.

PART 2 — WRITE:
Write two versions of the report:
- Professional (500 words): For investors with financial knowledge. Reference specific data.
- Beginner (150 words): For someone who just started investing. Plain English only. End with "This is not financial advice."

RULES:
1. You may agree with Analyst, agree with Critic, or find a middle ground.
2. Explicitly document what the losing side said — users see both views.
3. Final score may differ from both Analyst and Critic — use your judgment.
4. Never say "will", "guaranteed", "certain". Always hedge.
5. beginner_report MUST end with exactly: "This is not financial advice."
6. learn_term: pick ONE financial term used in your report and explain it simply.

Return ONLY this JSON:
{
  "final_signal": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "final_score": float,
  "final_price_target": float,
  "final_risk_score": int,
  "arbiter_reasoning": "string — why you decided as you did",
  "resolution": "sided_with_analyst|sided_with_critic|middle_ground",
  "dissent_noted": "string — what the losing argument said (shown to user)",
  "professional_report": "string — 500 words",
  "beginner_report": "string — 150 words ending with: This is not financial advice.",
  "learn_term": "string — one term + simple explanation"
}
```

---

## 9. LangGraph Graph Definition

### `agents/graph.py`

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.redis import RedisSaver
import asyncio
from agents.state import AgentState
from agents.orchestrator import run_orchestrator
from agents.cleaning.ngx_cleaner import NGXDataCleaningAgent
from agents.cleaning.us_cleaner import USDataCleaningAgent
from agents.researcher import run_researcher
from agents.macro_agent import run_macro_agent
from agents.regulatory_agent import run_regulatory_agent
from agents.analyst_agent import run_analyst
from agents.critic_agent import run_critic
from agents.arbiter_writer import run_arbiter_writer
from agents.validator import run_validator
from config import settings
import redis

# Redis for LangGraph checkpointing (node-level caching)
redis_client = redis.from_url(settings.REDIS_URL)
checkpointer = RedisSaver(redis_client)

async def run_cleaning_agent(state: AgentState) -> AgentState:
    """Route to correct cleaner based on market."""
    if state.input.market == "ng":
        cleaner = NGXDataCleaningAgent()
    else:
        cleaner = USDataCleaningAgent()
    state.cleaned_data = await cleaner.clean(state.input.symbol)
    state.events.append({
        "type": "data_quality",
        "quality": state.cleaned_data.data_quality,
        "price": state.cleaned_data.price,
        "currency": state.cleaned_data.currency,
        "warnings": state.cleaned_data.warnings,
    })
    return state

async def run_parallel_agents(state: AgentState) -> AgentState:
    """Run Researcher, Macro, and Regulatory agents simultaneously."""
    state.events.append({"type": "parallel_start",
                          "message": "Running research agents in parallel..."})

    results = await asyncio.gather(
        run_researcher(state),
        run_macro_agent(state),
        run_regulatory_agent(state),
        return_exceptions=True,
    )

    # Handle partial failures gracefully
    state.research    = results[0] if not isinstance(results[0], Exception) else None
    state.macro       = results[1] if not isinstance(results[1], Exception) else None
    state.regulatory  = results[2] if not isinstance(results[2], Exception) else None

    for i, name in enumerate(["researcher", "macro_agent", "regulatory_agent"]):
        if isinstance(results[i], Exception):
            state.errors.append(f"{name} failed: {str(results[i])}")
            state.events.append({"type": "agent_error", "agent": name,
                                  "error": str(results[i])})
        else:
            state.events.append({"type": "agent_complete", "agent": name})

    return state

def should_continue_to_analyst(state: AgentState) -> str:
    """Only proceed to analyst if we have minimum viable data."""
    if state.cleaned_data is None:
        return "end_with_error"
    if state.cleaned_data.data_quality == "STALE" and not state.research:
        return "serve_cache"
    return "analyst"

def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("orchestrator", run_orchestrator)
    graph.add_node("data_cleaning", run_cleaning_agent)
    graph.add_node("parallel_research", run_parallel_agents)
    graph.add_node("analyst", run_analyst)
    graph.add_node("critic", run_critic)
    graph.add_node("arbiter_writer", run_arbiter_writer)
    graph.add_node("validator", run_validator)

    # Define flow
    graph.set_entry_point("orchestrator")
    graph.add_edge("orchestrator", "data_cleaning")
    graph.add_conditional_edges("data_cleaning", should_continue_to_analyst, {
        "analyst": "parallel_research",
        "serve_cache": END,
        "end_with_error": END,
    })
    graph.add_edge("parallel_research", "analyst")
    graph.add_edge("analyst", "critic")
    graph.add_edge("critic", "arbiter_writer")
    graph.add_edge("arbiter_writer", "validator")
    graph.add_edge("validator", END)

    return graph.compile(checkpointer=checkpointer)

# Singleton graph instance
analysis_graph = build_graph()
```

---

## 10. FastAPI Backend

### `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import structlog

from config import settings
from routers import auth, users, search, signals, analysis, portfolio, alerts, billing, accuracy, learn, admin
from db.session import engine
from db.models import Base

log = structlog.get_logger()

# Create tables on startup (use Alembic migrations in production)
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="StockSense API",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,  # hide docs in prod
    redoc_url=None,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
ALLOWED_ORIGINS = [settings.FRONTEND_URL]
if not settings.is_production:
    ALLOWED_ORIGINS.extend(["http://localhost:5173", "http://localhost:3000"])

app.add_middleware(CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers.pop("Server", None)
        response.headers.pop("X-Powered-By", None)
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include routers
app.include_router(auth.router,       prefix="/auth",      tags=["auth"])
app.include_router(users.router,      prefix="/users",     tags=["users"])
app.include_router(search.router,     prefix="/search",    tags=["search"])
app.include_router(signals.router,    prefix="/signals",   tags=["signals"])
app.include_router(analysis.router,   prefix="/analysis",  tags=["analysis"])
app.include_router(portfolio.router,  prefix="/portfolio", tags=["portfolio"])
app.include_router(alerts.router,     prefix="/alerts",    tags=["alerts"])
app.include_router(billing.router,    prefix="/billing",   tags=["billing"])
app.include_router(accuracy.router,   prefix="/accuracy",  tags=["accuracy"])
app.include_router(learn.router,      prefix="/learn",     tags=["learn"])
app.include_router(admin.router,      prefix="/admin",     tags=["admin"])

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
```

### All API Endpoints

```
AUTH
POST   /auth/signup                 Register (email + password)
POST   /auth/login                  Login → access_token + refresh cookie
POST   /auth/logout                 Revoke refresh token
POST   /auth/refresh                New access token from refresh cookie
GET    /auth/verify-email           Verify email from link
POST   /auth/forgot-password        Send reset email
POST   /auth/reset-password         Reset with token
GET    /auth/google                 Google OAuth redirect
GET    /auth/google/callback        Google OAuth callback

USERS
GET    /users/me                    Current user profile
PUT    /users/me                    Update profile
DELETE /users/me                    Delete account (GDPR)
POST   /users/me/telegram/connect   Link Telegram account

SEARCH — Universal Stock Discovery
GET    /search?q=zenith&limit=10    Search all US + NGX stocks
GET    /search/stock/{symbol}       Get stock detail + latest Layer 1 signal
GET    /search/trending             Top 10 most-searched stocks today

SIGNALS — Layer 1
GET    /signals                     Latest signals (tier-limited: free=3, pro=all)
GET    /signals/{symbol}            Signal history for one stock
GET    /signals/market/{market}     All signals for US or NGX market

ANALYSIS — Layer 2 Deep Analysis
POST   /analysis/start              Start deep analysis (triggers agent pipeline)
GET    /analysis/stream/{job_id}    SSE stream of agent events
GET    /analysis/{report_id}        Get completed report
GET    /analysis/history            User's past analysis reports
GET    /analysis/cache/{symbol}     Check if cached report exists

PORTFOLIO
GET    /portfolio                   All holdings with live P&L
POST   /portfolio/trade             Log a trade
GET    /portfolio/history           All trades
DELETE /portfolio/{symbol}          Remove holding

WATCHLIST
GET    /watchlist                   User's watchlist
POST   /watchlist                   Add symbol
DELETE /watchlist/{symbol}          Remove symbol

ALERTS
GET    /alerts                      User's configured alerts
POST   /alerts                      Create price alert
DELETE /alerts/{id}                 Delete alert
GET    /alerts/log                  Alert history

BILLING — Paystack Only
GET    /billing/plans               All plans with NGN prices
POST   /billing/checkout            Initialize Paystack checkout
POST   /billing/webhook             Paystack webhook (HMAC verified)
POST   /billing/cancel              Cancel subscription
GET    /billing/status              Sync subscription status from Paystack
GET    /billing/history             Payment history

ACCURACY — Public Signal Tracker
GET    /accuracy/summary            Overall accuracy statistics
GET    /accuracy/by-market          Accuracy broken down by US/NGX
GET    /accuracy/by-signal          Accuracy by BUY/SELL/HOLD
GET    /accuracy/recent             Last 50 evaluated signals
GET    /accuracy/leaderboard        Top performing signal types

LEARN
GET    /learn/term                  Random financial term
GET    /learn/term/{term}           Specific term
GET    /learn/glossary              All terms

ADMIN
GET    /admin/users                 All users
GET    /admin/scans                 Scan run history
POST   /admin/scan/trigger          Manual scan trigger
GET    /admin/metrics               Platform metrics
GET    /admin/budget                Current spend vs limits

HEALTH
GET    /health                      System health check
```

---

## 11. Authentication System

### Full auth flow — see SECURITY.md for edge cases

```python
# services/auth_service.py — key functions only

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import secrets
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str, email: str, tier: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "tier": tier,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(user_id: str) -> tuple[str, str]:
    """Returns (token, token_hash). Store hash in DB, send token to client."""
    token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash

def verify_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != "access":
        raise JWTError("Wrong token type")
    return payload
```

---

## 12. Stock Search — Universal Discovery

### This is the entry point for all user-initiated analysis

```python
# routers/search.py

from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from db.crud import search_stocks, get_stock_detail
from services.search_service import get_trending_stocks

router = APIRouter()

@router.get("")
async def search(
    q: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Universal stock search. Searches both US (NYSE/NASDAQ) and NGX stocks.
    Returns matching stocks with latest Layer 1 signal if available.
    
    Used by the search bar on the dashboard. Shows results as user types.
    Debounced on frontend (300ms delay before calling API).
    """
    if len(q.strip()) < 1:
        return {"results": []}

    results = search_stocks(db, query=q.strip(), limit=limit)
    return {
        "results": results,
        "query": q,
        "total": len(results),
    }

@router.get("/stock/{symbol}")
async def get_stock(
    symbol: str,
    exchange: str = Query("auto"),  # auto-detect exchange if not specified
    db: Session = Depends(get_db),
):
    """
    Get full stock detail page data:
    - Stock info (name, sector, exchange, currency)
    - Latest Layer 1 signal (if exists from today's scan)
    - Price chart data (last 30 days)
    - Whether user can run Deep Analysis (tier check)
    - Upgrade prompt data if not on Pro
    """
    stock = get_stock_detail(db, symbol=symbol.upper(), exchange=exchange)
    if not stock:
        return {"error": "Stock not found", "symbol": symbol}
    return stock
```

### Search bar behaviour on frontend

```typescript
// hooks/useStockSearch.ts
// Debounced search — calls API 300ms after user stops typing
// Shows dropdown with results: symbol, name, exchange flag, latest signal badge
// On select → navigate to /stock/{symbol}?exchange={exchange}

// On /stock/{symbol} page:
// - Show stock info, price, chart
// - Show latest Layer 1 signal card (if exists)
// - Show "Deep Analysis" button
//   → If Free user: show UpgradeModal with Paystack checkout
//   → If Pro user: navigate to /analysis/{symbol} and start streaming
```

---

## 13. Payment System — Paystack Only

### Setup Before Writing Code

1. Create Paystack account at paystack.com
2. Create Plans in Paystack Dashboard:
   - Pro Monthly: ₦12,999/month → save `plan_code` as `PAYSTACK_PRO_PLAN_CODE`
   - Pro Annual: ₦116,999/year → save as `PAYSTACK_PRO_ANNUAL_PLAN_CODE`
   - Enterprise Monthly: ₦49,999/month → save as `PAYSTACK_ENTERPRISE_PLAN_CODE`
   - Enterprise Annual: ₦449,999/year → save as `PAYSTACK_ENTERPRISE_ANNUAL_PLAN_CODE`
3. Add webhook URL in Paystack Dashboard → Settings → Webhooks:
   `https://api.stocksense.app/billing/webhook`

### `services/paystack_service.py`

```python
import hashlib
import hmac
import requests
import json
import structlog
from datetime import datetime
from config import settings
from db import crud

log = structlog.get_logger()

PAYSTACK_BASE = "https://api.paystack.co"
HEADERS = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"}

def initialize_checkout(user_email: str, user_id: str, plan: str, billing: str) -> dict:
    """
    Create a Paystack checkout session.
    billing: 'monthly' | 'annual'
    
    IMPORTANT: Paystack amounts are in KOBO (100 kobo = ₦1)
    ₦12,999 monthly → 1299900 kobo
    """
    plan_map = {
        ("pro", "monthly"):        settings.PAYSTACK_PRO_PLAN_CODE,
        ("pro", "annual"):         settings.PAYSTACK_PRO_ANNUAL_PLAN_CODE,
        ("enterprise", "monthly"): settings.PAYSTACK_ENTERPRISE_PLAN_CODE,
        ("enterprise", "annual"):  settings.PAYSTACK_ENTERPRISE_ANNUAL_PLAN_CODE,
    }
    plan_code = plan_map.get((plan, billing))
    if not plan_code:
        raise ValueError(f"Invalid plan/billing combination: {plan}/{billing}")

    amount_map = {
        ("pro", "monthly"):        1299900,   # ₦12,999 in kobo
        ("pro", "annual"):         11699900,  # ₦116,999 in kobo
        ("enterprise", "monthly"): 4999900,   # ₦49,999 in kobo
        ("enterprise", "annual"):  44999900,  # ₦449,999 in kobo
    }
    amount = amount_map[(plan, billing)]

    response = requests.post(
        f"{PAYSTACK_BASE}/transaction/initialize",
        headers=HEADERS,
        json={
            "email": user_email,
            "amount": amount,
            "plan": plan_code,
            "callback_url": f"{settings.FRONTEND_URL}/billing?success=paystack",
            "metadata": {
                "user_id": user_id,
                "plan": plan,
                "billing": billing,
                "custom_fields": [
                    {"display_name": "User ID",    "variable_name": "user_id",    "value": user_id},
                    {"display_name": "Plan",       "variable_name": "plan",       "value": plan},
                    {"display_name": "Billing",    "variable_name": "billing",    "value": billing},
                ],
            },
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("status"):
        raise ValueError(f"Paystack init failed: {data.get('message')}")
    return {
        "checkout_url": data["data"]["authorization_url"],
        "reference": data["data"]["reference"],
    }

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    CRITICAL: Always verify before processing any webhook.
    Paystack signs webhooks with HMAC-SHA512 using your secret key.
    """
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
        payload,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

async def process_webhook(payload: bytes, signature: str, db) -> None:
    """
    Process Paystack webhook events.
    ALWAYS verify signature first.
    ALWAYS check idempotency before processing.
    """
    if not verify_webhook_signature(payload, signature):
        log.error("Invalid Paystack webhook signature")
        raise ValueError("Invalid signature")

    event = json.loads(payload)
    event_type = event.get("event")
    data = event.get("data", {})

    # IDEMPOTENCY: use reference or subscription_code as unique identifier
    reference = (data.get("reference") or
                 data.get("subscription_code") or
                 f"{event_type}_{data.get('id', '')}")

    existing = crud.get_payment_event(db, gateway_event_id=reference)
    if existing:
        log.info("Duplicate webhook ignored", reference=reference)
        return  # Already processed — return silently

    log.info("Processing Paystack webhook", event_type=event_type, reference=reference)

    match event_type:
        case "charge.success":
            await _handle_charge_success(data, db, reference)
        case "subscription.create":
            await _handle_subscription_created(data, db, reference)
        case "subscription.disable":
            await _handle_subscription_cancelled(data, db, reference)
        case "invoice.payment_failed":
            await _handle_payment_failed(data, db, reference)
        case "invoice.update":
            await _handle_invoice_updated(data, db, reference)
        case _:
            log.info("Unknown event type — logged and ignored", event_type=event_type)

    # Record as processed
    crud.create_payment_event(db, {
        "gateway": "paystack",
        "event_type": event_type,
        "gateway_event_id": reference,
        "amount": data.get("amount", 0) / 100 if data.get("amount") else None,
        "currency": "NGN",
        "status": "processed",
        "raw_payload": event,
    })

async def _handle_charge_success(data: dict, db, reference: str) -> None:
    """First payment + renewals. Verify amount before activating."""
    metadata = data.get("metadata", {})
    user_id = None

    # Extract user_id from custom_fields
    custom_fields = metadata.get("custom_fields", [])
    for field in custom_fields:
        if field.get("variable_name") == "user_id":
            user_id = field.get("value")
            break

    if not user_id:
        log.error("charge.success with no user_id in metadata", reference=reference)
        return

    plan = next((f["value"] for f in custom_fields if f["variable_name"] == "plan"), None)

    # FRAUD CHECK: Verify amount matches expected plan amount
    expected_amounts = {
        "pro": [1299900, 11699900],        # monthly or annual in kobo
        "enterprise": [4999900, 44999900],
    }
    actual_amount = data.get("amount", 0)
    if plan and actual_amount not in expected_amounts.get(plan, []):
        log.error("Amount mismatch — possible fraud",
                  expected=expected_amounts.get(plan),
                  actual=actual_amount,
                  user_id=user_id)
        return  # Do NOT activate subscription

    tier = plan if plan in ("pro", "enterprise") else None
    if tier:
        crud.update_user_tier(db, user_id=user_id, tier=tier)
        log.info("Subscription activated", user_id=user_id, tier=tier)

async def _handle_subscription_created(data: dict, db, reference: str) -> None:
    """
    CRITICAL: Save email_token — required later to cancel subscription.
    If we lose this, we cannot cancel via API.
    """
    subscription_code = data.get("subscription_code")
    email_token = data.get("email_token")    # MUST save this
    customer_code = data.get("customer", {}).get("customer_code")
    customer_email = data.get("customer", {}).get("email")

    if not email_token:
        log.error("subscription.create has no email_token",
                  subscription_code=subscription_code)

    user = crud.get_user_by_email(db, email=customer_email)
    if not user:
        log.error("User not found for subscription", email=customer_email)
        return

    crud.upsert_subscription(db, {
        "user_id": user.id,
        "paystack_subscription_code": subscription_code,
        "paystack_customer_code": customer_code,
        "paystack_email_token": email_token,     # SAVED
        "plan": user.tier,
        "currency": "NGN",
        "amount": data.get("amount", 0) / 100,
        "status": "active",
        "current_period_start": datetime.utcnow(),
    })

async def _handle_subscription_cancelled(data: dict, db, reference: str) -> None:
    """Downgrade user to free tier. Keep subscription record for audit."""
    subscription_code = data.get("subscription_code")
    sub = crud.get_subscription_by_code(db, code=subscription_code)
    if sub:
        crud.cancel_subscription(db, subscription_id=sub.id)
        crud.update_user_tier(db, user_id=str(sub.user_id), tier="free")
        log.info("User downgraded to free", user_id=sub.user_id)

async def cancel_subscription(user_id: str, db) -> dict:
    """Cancel via Paystack API. Requires saved email_token."""
    sub = crud.get_active_subscription(db, user_id=user_id)
    if not sub:
        raise ValueError("No active subscription found")
    if not sub.paystack_email_token:
        raise ValueError("Cannot cancel — email_token missing. Contact support.")

    response = requests.post(
        f"{PAYSTACK_BASE}/subscription/disable",
        headers=HEADERS,
        json={
            "code": sub.paystack_subscription_code,
            "token": sub.paystack_email_token,
        },
        timeout=30,
    )
    data = response.json()
    if not data.get("status"):
        raise ValueError(f"Cancellation failed: {data.get('message')}")

    # Don't downgrade here — wait for subscription.disable webhook
    crud.set_cancel_at_period_end(db, subscription_id=sub.id)
    return {"message": "Subscription will end at current period end"}
```

---

## 14. Telegram Alerts

### Alert Types and Format

```python
# services/telegram_service.py

from telegram import Bot
from telegram.constants import ParseMode
import structlog

log = structlog.get_logger()
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

async def send_morning_briefing(chat_id: str, picks: list[dict], user_tier: str) -> bool:
    """
    Format and send the daily morning briefing.
    Free users get 3 picks with weekly cadence.
    Pro users get all picks daily.
    """
    signal_emoji = {
        "STRONG_BUY": "🟢", "BUY": "🟢",
        "HOLD": "🟡",
        "SELL": "🔴", "STRONG_SELL": "🔴",
    }
    currency_symbol = {"us": "$", "ng": "₦", "crypto": "$"}

    lines = [
        "◈ *StockSense · Morning Briefing* 📊",
        f"_{datetime.now().strftime('%A %d %b')} · US + NGX Markets Open_",
        "━━━━━━━━━━━━━━━━━━━━━━━",
    ]

    for pick in picks[:10]:  # max 10 in one message
        curr = currency_symbol.get(pick["market"], "$")
        emoji = signal_emoji.get(pick["signal"], "⚪")
        lines.extend([
            f"\n{emoji} *{pick['signal']}* · {pick['symbol']} · {curr}{pick['price']:,.2f} ({pick['change_pct']:+.1f}%)",
            f"   Score: {pick['score']}/10 · Risk: {pick['risk_score']}/10",
            f"   _{pick['reason']}_",
            f"   👤 _{pick['beginner_note']}_",
        ])

    lines.extend([
        "\n━━━━━━━━━━━━━━━━━━━━━━━",
        f"\n📚 *Learn*: {picks[0].get('learn_term', '')}",
        "\n⚠️ _Not financial advice. Educational signals only._",
    ])

    if user_tier == "free":
        lines.append("\n⭐ _Upgrade to Pro for daily alerts → stocksense.app/billing_")

    message = "\n".join(lines)

    # Telegram has 4096 char limit
    if len(message) > 4000:
        message = message[:3900] + "\n...\n_See full report on stocksense.app_"

    try:
        await bot.send_message(
            chat_id=chat_id,
            text=message,
            parse_mode=ParseMode.MARKDOWN,
        )
        return True
    except Exception as e:
        log.error("Telegram send failed", chat_id=chat_id, error=str(e))
        # If Forbidden: user blocked bot — remove their chat_id
        if "Forbidden" in str(e):
            log.warning("User blocked bot — clearing chat_id", chat_id=chat_id)
            # crud.clear_telegram_chat_id(chat_id) — called from router
        return False
```

---

## 15. React Frontend — All Pages

### Key Pages and Behaviour

#### Dashboard (`/dashboard`)
- Top: search bar ("Search any US or NGX stock...")
- Market summary bar: US index, NGX index, USD/NGN rate
- "Today's Picks" section: Layer 1 signal cards
- Free users see 3 cards, rest blurred with "Upgrade" overlay
- Right panel: portfolio summary, AI tip of the day

#### Stock Detail (`/stock/:symbol`)
- Header: symbol, company name, exchange badge (NYSE/NGX), current price
- Price chart: 30-day line chart (Recharts)
- Latest Layer 1 signal card (if available today)
- "Deep Analysis" button → triggers Layer 2
  - Free/Starter users → `<UpgradeModal />` with Paystack checkout
  - Pro/Enterprise → navigate to analysis view
- Add to watchlist button
- Recent signals history (last 5)

#### Analysis Page (`/analysis/:symbol`)
- Live streaming progress panel (left column)
- Report builds on the right as agents complete
- Final report: three tabs:
  1. "Arbiter's Call" — final recommendation
  2. "The Debate" — Analyst vs Critic
  3. "For Beginners" — plain English
- User decision buttons: "I agree — BUY" | "I side with Critic"
- Share button (generates public link to report)

#### Accuracy Dashboard (`/accuracy`)
- Public page — no auth required
- Shows: overall accuracy %, by market, by signal type
- "Based on X evaluated signals over 90 days"
- Methodology explained clearly
- Recent signal outcomes table

---

## 16. Streaming — SSE Architecture

### How streaming works end-to-end

```python
# routers/analysis.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import asyncio
import uuid

from db.session import get_db
from middleware.auth import get_current_user
from middleware.tier_guard import require_tier
from agents.graph import analysis_graph
from agents.state import AgentState, StockInput
from services.budget_service import check_budget
from services.cache_service import get_cached_analysis, should_use_cache

router = APIRouter()

@router.post("/start")
async def start_analysis(
    symbol: str,
    exchange: str = "auto",
    user=Depends(require_tier("pro", "enterprise")),
    db: Session = Depends(get_db),
):
    """
    Start a deep analysis job.
    Returns a job_id that the client uses to connect to the SSE stream.
    """
    # Check daily limit
    if user.tier == "pro" and user.deep_analyses_today >= 3:
        raise HTTPException(429, "Daily analysis limit reached (3/day on Pro). Resets at midnight.")

    # Check budget
    await check_budget(user_id=str(user.id))

    # Check cache
    cached = await get_cached_analysis(symbol=symbol, market_data=None)
    if cached and not should_use_cache(cached) == "FULL_FRESH":
        return {"job_id": None, "cached": True, "report_id": cached.id}

    job_id = str(uuid.uuid4())
    # Store job_id in Redis with initial state
    return {"job_id": job_id, "cached": False}

@router.get("/stream/{job_id}")
async def stream_analysis(
    job_id: str,
    symbol: str,
    exchange: str = "auto",
    user=Depends(get_current_user),
):
    """
    SSE endpoint. Client connects here and receives agent events as they happen.
    Each event is: data: {type, agent, message, ...}\n\n
    """
    async def event_generator():
        state = AgentState(
            input=StockInput(
                symbol=symbol.upper(),
                exchange=exchange,
                market="ng" if exchange == "NGX" else "us",
                user_id=str(user.id),
                user_tier=user.tier,
            )
        )

        # Run the graph — it yields events as agents complete
        try:
            async for chunk in analysis_graph.astream(state):
                # Each chunk contains the latest state
                current_state = list(chunk.values())[0]
                for event in current_state.events:
                    yield f"data: {json.dumps(event)}\n\n"
                    await asyncio.sleep(0)  # yield control to event loop
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering for SSE
        },
    )
```

### Frontend SSE Hook

```typescript
// hooks/useAnalysisStream.ts

import { useState, useEffect, useRef } from "react";

interface AgentEvent {
  type: string;
  agent?: string;
  message?: string;
  quality?: string;
  signal?: string;
  score?: number;
}

export function useAnalysisStream(jobId: string | null, symbol: string) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const url = `/analysis/stream/${jobId}?symbol=${symbol}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const event: AgentEvent = JSON.parse(e.data);
      if (event.type === "complete") {
        setIsComplete(true);
        es.close();
      } else if (event.type === "error") {
        setError(event.message || "Analysis failed");
        es.close();
      } else {
        setEvents((prev) => [...prev, event]);
      }
    };

    es.onerror = () => {
      setError("Connection lost. Please try again.");
      es.close();
    };

    return () => es.close();
  }, [jobId, symbol]);

  return { events, isComplete, error };
}
```

---

## 17. Caching Strategy

### Cache keys and TTL

```python
# services/cache_service.py

import redis.asyncio as aioredis
import json
from config import settings

redis_client = aioredis.from_url(settings.REDIS_URL)

CACHE_TTL = {
    "layer1_signal":    60 * 60 * 4,    # 4 hours
    "layer2_report":    60 * 60 * 4,    # 4 hours
    "macro_data":       60 * 60 * 4,    # 4 hours — macro changes slowly
    "regulatory_data":  60 * 60 * 24,   # 24 hours — filings change rarely
    "stock_search":     60 * 60,         # 1 hour
    "stock_price":      60 * 15,         # 15 minutes
    "ngx_price":        60 * 30,         # 30 minutes — NGX updates less frequently
    "accuracy_stats":   60 * 60,         # 1 hour
}

async def get_cached_analysis(symbol: str, market: str) -> dict | None:
    key = f"analysis:{market}:{symbol.upper()}"
    data = await redis_client.get(key)
    return json.loads(data) if data else None

async def set_cached_analysis(symbol: str, market: str, report: dict) -> None:
    key = f"analysis:{market}:{symbol.upper()}"
    await redis_client.setex(key, CACHE_TTL["layer2_report"], json.dumps(report))

def should_use_cache(cached: dict, current_price: float) -> str:
    """
    Decide whether to use cache or run fresh analysis.
    Returns: FULL_FRESH | PARTIAL_REFRESH | SERVE_CACHE
    """
    if not cached:
        return "FULL_FRESH"

    cached_price = cached.get("price_at_analysis", 0)
    if cached_price == 0:
        return "FULL_FRESH"

    price_delta = abs(current_price - cached_price) / cached_price

    # Signal flipped — always run fresh
    cached_signal = cached.get("final_signal", "")
    if price_delta > 0.05:  # price moved >5%
        return "FULL_FRESH"

    if price_delta > 0.02:  # price moved 2-5%
        return "PARTIAL_REFRESH"  # re-run analyst+critic, reuse macro+regulatory

    return "SERVE_CACHE"   # nothing material changed — zero API calls
```

---

## 18. Signal Accuracy Tracker

### Automated evaluation job

```python
# services/accuracy_service.py

async def evaluate_pending_outcomes(db) -> None:
    """
    Called by GitHub Actions daily.
    Evaluates all signals that were generated 30 days ago.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=30)

    pending = db.query(SignalOutcome).filter(
        SignalOutcome.outcome == "PENDING",
        SignalOutcome.generated_at <= cutoff_date,
    ).all()

    log.info("Evaluating signal outcomes", count=len(pending))

    for record in pending:
        try:
            current_price = await fetch_current_price(record.symbol, record.market)
            if not current_price:
                continue

            price_change_pct = ((current_price - record.price_at_signal)
                                / record.price_at_signal * 100)

            MARGIN = 3.0  # ±3% counts as neutral
            signal = record.signal_type

            if signal in ("BUY", "STRONG_BUY"):
                if price_change_pct > MARGIN:     outcome = "CORRECT"
                elif price_change_pct < -MARGIN:  outcome = "INCORRECT"
                else:                             outcome = "NEUTRAL"
            elif signal in ("SELL", "STRONG_SELL"):
                if price_change_pct < -MARGIN:    outcome = "CORRECT"
                elif price_change_pct > MARGIN:   outcome = "INCORRECT"
                else:                             outcome = "NEUTRAL"
            else:  # HOLD
                outcome = "CORRECT" if abs(price_change_pct) <= MARGIN else "NEUTRAL"

            record.outcome = outcome
            record.evaluated_at = datetime.utcnow()
            record.price_at_eval = current_price
            record.price_change_pct = price_change_pct
            db.commit()

        except Exception as e:
            log.error("Failed to evaluate signal", symbol=record.symbol, error=str(e))

def get_accuracy_summary(db) -> dict:
    """Used by GET /accuracy/summary — cached for 1 hour."""
    from sqlalchemy import func

    results = db.query(
        SignalOutcome.market,
        SignalOutcome.signal_type,
        func.count().label("total"),
        func.sum(case((SignalOutcome.outcome == "CORRECT", 1), else_=0)).label("correct"),
    ).filter(
        SignalOutcome.outcome != "PENDING",
    ).group_by(
        SignalOutcome.market,
        SignalOutcome.signal_type,
    ).all()

    return {
        "data": [
            {
                "market": r.market,
                "signal": r.signal_type,
                "total": r.total,
                "correct": r.correct,
                "accuracy_pct": round(r.correct / r.total * 100, 1) if r.total > 0 else 0,
            }
            for r in results
        ],
        "updated_at": datetime.utcnow().isoformat(),
    }
```

---

## 19. GitHub Actions

### `.github/workflows/daily_scan.yml`

```yaml
name: StockSense Daily Scanner
on:
  schedule:
    - cron: "35 14 * * 1-5"   # 9:35 AM ET — US market open
    - cron: "05 9 * * 1-5"    # 10:05 AM WAT — NGX market open
    - cron: "0 7 * * *"       # 7:00 AM UTC — crypto
  workflow_dispatch:            # Allow manual trigger

jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r requirements.txt --quiet
      - name: Run scanner
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          REDIS_URL: ${{ secrets.REDIS_URL }}
          ENVIRONMENT: production
        run: python scanner/main.py
      - name: Upload log on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: scan-log-${{ github.run_id }}
          path: "*.log"
          retention-days: 7
```

### `.github/workflows/accuracy_eval.yml`

```yaml
name: Signal Accuracy Evaluation
on:
  schedule:
    - cron: "0 6 * * *"   # 6 AM UTC daily
  workflow_dispatch:

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r requirements.txt --quiet
      - name: Evaluate outcomes
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
        run: python -c "from services.accuracy_service import evaluate_pending_outcomes; import asyncio; asyncio.run(evaluate_pending_outcomes())"
```

---

## 20. Deployment

### Step 1 — Supabase (Database)

1. Create project at supabase.com
2. Run the SQL schema from Section 4 in the SQL editor
3. Copy connection string to `DATABASE_URL` in `.env`
4. Enable Row Level Security (RLS) — see SECURITY.md

### Step 2 — Upstash Redis

1. Create database at upstash.com (free tier)
2. Copy Redis URL to `REDIS_URL` in `.env`

### Step 3 — Render (Backend API)

1. Connect GitHub repo at render.com
2. Create Web Service: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add all environment variables from Section 5
4. Copy deploy hook URL to GitHub Secrets as `RENDER_DEPLOY_HOOK`

### Step 4 — Vercel (Frontend)

1. Connect GitHub repo at vercel.com
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Copy Vercel token to GitHub Secrets as `VERCEL_TOKEN`

### Step 5 — GitHub Secrets

Add all secrets from Section 5 to:
`GitHub repo → Settings → Secrets and variables → Actions`

### Step 6 — Paystack Setup

1. Create plans in Paystack Dashboard
2. Add webhook URL: `https://api.stocksense.app/billing/webhook`
3. Add plan codes to environment variables

### Step 7 — Telegram Bot

1. Message @BotFather on Telegram → `/newbot`
2. Save token to `TELEGRAM_BOT_TOKEN`
3. Message your bot once → call `getUpdates` to get your `TELEGRAM_ADMIN_CHAT_ID`

---

## Important Notes for Claude

1. **Never write raw SQL with user input** — always use SQLAlchemy ORM
2. **Never hardcode secrets** — always use `settings.VARIABLE_NAME`
3. **Always validate Paystack webhook signature** before processing
4. **Never upgrade user tier without webhook confirmation** — callback URL is NOT reliable
5. **NGX prices might be in kobo** — check for prices >10,000 and divide by 100
6. **System prompts are cached** — structure prompts as [SYSTEM (static)] + [USER (dynamic)]
7. **Groq is free** — use it for all data-extraction agents (Researcher, Macro, Regulatory)
8. **Gemini is paid** — use only for Analyst, Critic, Arbiter (the reasoning agents)
9. **All agent outputs must be validated** — use Pydantic schemas, reject hallucinated data
10. **Log everything** — use structlog, never log passwords or full tokens
11. **Budget guards are not optional** — implement before deploying
12. **See SECURITY.md** for complete auth edge cases and SQL injection prevention
13. **See PERFORMANCE.md** for caching patterns and optimisation
14. **See SKILLS.md** for agent prompt engineering best practices

---

*Last updated: April 2026 | StockSense v1.0.0*
