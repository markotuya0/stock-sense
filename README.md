# StockSense — AI Investment Intelligence Platform

> **⚠️ Active Development & Refinement** — This platform is currently in active development. Core features are being built out, and the architecture/API may evolve. The product is fully specified but not yet feature-complete.

## What is StockSense?

StockSense is a **two-layer AI investment intelligence platform** for African and US equity markets:

### **Layer 1: Automated Daily Scanner** 🤖
- Runs every weekday at market open
- Scans 500+ US and NGX (Nigerian) stocks automatically
- Uses AI (Groq Llama 3.1) to identify high-conviction trading signals
- Delivers top picks via Telegram within seconds
- **Free for all users** (limited to 3 picks/day for Free tier)

### **Layer 2: Multi-Agent Deep Analysis** 📊
- User searches any US or NGX stock → clicks "Deep Analysis"
- 7-agent LangGraph pipeline runs in parallel:
  - **Researcher** — enriches data with news, filings, insider trades
  - **Macro Agent** — CBN rates, Fed policy, FX trends, oil price
  - **Regulatory Agent** — compliance status, earnings calendar
  - **Analyst** — bullish/bearish signal with score and price target
  - **Critic** — challenges analyst with counter-arguments
  - **Arbiter** — mediates dispute, writes final recommendation
  - **Writer** — formats report for human consumption
- Full report streamed progressively to browser
- Complete analysis in 8–15 seconds
- **Pro feature** (₦12,999/month): 3 analyses/day

## Technical Stack

### Backend
```
Python 3.11+           FastAPI 0.115
SQLAlchemy 2.0         Pydantic 2.10
Alembic 1.14           LangGraph 0.2.60
Groq API               Google Gemini API
Redis (Upstash)        PostgreSQL (Supabase)
```

### Frontend
```
React 18.3             TypeScript 5.7
Vite 6.0               TailwindCSS 3.4
Zustand 5.0            React Query 5.62
React Router 6.28      Recharts 2.14
```

### Infrastructure (All Free Tier)
```
Database:  Supabase (PostgreSQL, 500MB)
Cache:     Upstash Redis (10k req/day)
API:       Render.com (free tier)
Frontend:  Vercel (unlimited)
Scheduler: GitHub Actions (2000 min/month)
Emails:    Resend.com (3000/month)
```

### AI Models
```
Groq llama-3.1-8b        → Data extraction, pattern matching (FREE)
Groq llama-3.3-70b       → Complex analysis fallback (FREE)
Gemini 2.0 Flash         → Analyst, Critic (≈$0.0004/analysis)
Gemini 2.5 Flash Preview → Arbiter, Report writing (≈$0.004/analysis)
Total cost per deep analysis: ≈$0.0047
```

## Pricing Tiers

| Feature | Free | Pro (₦12,999/mo) | Enterprise (₦49,999/mo) |
|---|---|---|---|
| Daily picks (Layer 1) | 3 | Unlimited | Unlimited |
| Deep Analysis (Layer 2) | ❌ | 3/day | Unlimited |
| Real-time price alerts | ❌ | ✅ | ✅ |
| Agent debate view | ❌ | ✅ | ✅ |
| Signal accuracy dashboard | Public only | Full history | Full + API |
| Telegram daily briefing | ❌ | ✅ | ✅ |
| Portfolio tracking | View-only | Full P&L | Full + export |

## Project Structure

```
stocksense/
│
├── main.py                         # FastAPI app entry point
├── config.py                       # Pydantic Settings — all env vars
├── models.py                       # Request/response Pydantic schemas
├── requirements.txt                # Python dependencies
│
├── agents/                         # 7-agent LangGraph system
│   ├── state.py                    # AgentState — shared memory
│   ├── graph.py                    # Graph definition & wiring
│   ├── orchestrator.py             # Query parser & router
│   ├── cleaning/
│   │   ├── us_cleaner.py           # US stock validation
│   │   └── ngx_cleaner.py          # NGX thin market specialist
│   ├── researcher.py               # Groq — data enrichment
│   ├── macro_agent.py              # Groq — macro context
│   ├── regulatory_agent.py         # Groq — filings & compliance
│   ├── analyst_agent.py            # Gemini — signal generation
│   ├── critic_agent.py             # Gemini — counter-arguments
│   ├── arbiter_writer.py           # Gemini — final report
│   └── validator.py                # Sanity checks (no LLM)
│
├── scanner/                        # Layer 1 daily scanner
│   ├── main.py                     # Entry point (GitHub Actions)
│   ├── us_scanner.py               # Fetch US stocks (yfinance)
│   ├── ngx_scanner.py              # Fetch NGX stocks (scraper)
│   ├── crypto_scanner.py           # Fetch crypto (CoinGecko)
│   └── daily_analyst.py            # Groq — signal generation
│
├── routers/                        # FastAPI endpoint handlers
│   ├── auth.py                     # /auth/* — login, signup, OAuth
│   ├── search.py                   # /search — universal stock search
│   ├── signals.py                  # /signals/* — daily picks
│   ├── analysis.py                 # /analysis/* — Layer 2 + SSE
│   ├── portfolio.py                # /portfolio/* — holdings & P&L
│   ├── alerts.py                   # /alerts/* — price alerts
│   ├── billing.py                  # /billing/* — Paystack
│   ├── accuracy.py                 # /accuracy/* — signal tracker
│   └── admin.py                    # /admin/* — internal tools
│
├── services/                       # Business logic (no HTTP/DB)
│   ├── auth_service.py             # JWT, bcrypt, Google OAuth
│   ├── paystack_service.py         # Paystack integration
│   ├── telegram_service.py         # Telegram alerts
│   ├── cache_service.py            # Redis + cache strategy
│   ├── accuracy_service.py         # Outcome evaluation
│   ├── budget_service.py           # Spend tracking
│   ├── search_service.py           # Stock search logic
│   └── streaming_service.py        # SSE events
│
├── db/
│   ├── models.py                   # SQLAlchemy ORM tables
│   ├── crud.py                     # Database operations
│   ├── session.py                  # Engine & session config
│   └── migrations/                 # Alembic versions
│
├── middleware/
│   ├── auth.py                     # JWT → user injection
│   ├── tier_guard.py               # Free/Pro/Enterprise access control
│   ├── rate_limit.py               # Rate limiting (slowapi)
│   └── security_headers.py         # HSTS, CSP, etc.
│
├── data/
│   ├── us_stocks.json              # S&P 500 + NASDAQ symbols
│   └── ngx_stocks.json             # All NGX listed companies
│
├── .github/
│   └── workflows/
│       ├── daily_scan.yml          # Layer 1 scheduler
│       ├── accuracy_eval.yml       # Daily outcome evaluation
│       └── deploy.yml              # Auto-deploy to Render
│
├── tests/
│   ├── test_auth.py
│   ├── test_search.py
│   ├── test_agents.py
│   ├── test_ngx_cleaner.py
│   └── conftest.py
│
└── frontend/                       # React 18 + Vite
    ├── src/
    │   ├── components/             # React components
    │   ├── pages/                  # Route pages
    │   ├── api/                    # API client
    │   ├── store/                  # Zustand state
    │   ├── hooks/                  # Custom hooks
    │   └── App.tsx
    └── package.json
```

## Development Status

| Component | Status | Notes |
|---|---|---|
| Project Structure | ✅ Complete | All directories initialized |
| Documentation | ✅ Complete | PRD, SKILLS, SECURITY, PERFORMANCE |
| LangGraph Agents | 🔄 In Progress | Pattern library documented |
| Database Schema | 🔄 In Progress | Tables to be migrated |
| API Endpoints | 🔄 In Progress | FastAPI routers framework ready |
| Authentication | 🔄 In Progress | JWT + Google OAuth patterns defined |
| Payment Integration | 🔄 In Progress | Paystack security spec ready |
| Frontend UI | ⏳ Planned | React components pending |
| Layer 1 Scanner | ⏳ Planned | Groq integration pending |
| Layer 2 Analysis | ⏳ Planned | Multi-agent orchestration pending |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup

```bash
git clone https://github.com/markotuya/stock-sense.git
cd stock-sense

# Virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Key Documentation

Read these **before** writing code:

1. **[PRD.md](docs/PRD.md)** — Complete product requirements, every endpoint, every field
2. **[SKILLS.md](docs/SKILLS.md)** — LangGraph patterns, agent architecture, model selection
3. **[SECURITY.md](docs/SECURITY.md)** — Authentication, payment security, input validation
4. **[PERFORMANCE.md](docs/PERFORMANCE.md)** — Caching strategy, query optimization, targets

## Architecture Highlights

### Two-Layer Design
- **Layer 1** runs automatically → quick daily signals (free)
- **Layer 2** runs on-demand → deep research (Pro feature)

### Multi-Agent Orchestration
- Agents run in **parallel** where possible (3x faster)
- State flows through graph, never global variables
- Partial failure is acceptable (Critic fails → Analyst still completes)

### Cost Optimization
- Free Groq tier for extraction & pattern matching
- Cached system prompts (Gemini prompt caching)
- Cache hit target: >75% of Layer 2 requests

### NGX Market Specialist
- Detects stale data (identical closes for 3+ days)
- Fixes kobo/naira confusion (prices >₦10,000)
- Requires 14 **trading** days for RSI (not calendar days)

### Real-Time Streaming
- Layer 2 analysis streams as Server-Sent Events (SSE)
- User sees agent progress: "Researching...", "Analyst thinking...", etc.
- Report appears incrementally — no waiting

## Environment Variables

See [.env.example](.env.example) for all variables. Key ones:

```env
# Database
DATABASE_URL=postgresql://...

# APIs
GROQ_API_KEY=gsk_...
GOOGLE_API_KEY=...
PAYSTACK_SECRET_KEY=sk_live_...

# Telegram (for alerts)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=...

# App
SECRET_KEY=<64-char random hex>
DEBUG=False
ENVIRONMENT=production
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for code style, testing, and PR guidelines.

### Before Committing Code

1. Read the relevant documentation section (PRD → SKILLS → SECURITY/PERFORMANCE)
2. Follow the patterns in [SKILLS.md](docs/SKILLS.md) exactly
3. Run: `pytest tests/ -v`
4. Check security rules in [SECURITY.md](docs/SECURITY.md)

## Support & Issues

- Open issues on GitHub for bugs or feature requests
- Check existing docs first — most edge cases are covered
- For security issues: please email privately

---

**Status:** 🔄 **Active Development** — Fully specified, core features being built  
**Last Updated:** April 2026  
**Maintainer:** [@markotuya0](https://github.com/markotuya0)
