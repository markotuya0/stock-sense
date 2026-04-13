# StockSense — MASTER_PROMPT.md
## The Single Prompt to Rule Them All

> Paste this entire file as your first message to Claude in VS Code.
> Everything Claude needs to build StockSense correctly is here or
> referenced from the other docs in this folder.

---

## How to use this file

1. Open your StockSense project in VS Code
2. Open Claude (or your AI assistant)
3. Say: **"Read MASTER_PROMPT.md and all referenced docs before we start"**
4. Claude reads this file + PRD.md + SECURITY.md + SKILLS.md + PERFORMANCE.md
5. Then give task-specific instructions from the task list below
6. Claude builds correctly every time

---

## The Master Context Prompt

```
You are building StockSense — an AI-powered investment intelligence platform.

BEFORE WRITING ANY CODE, read and internalize these documents in this order:
1. PRD.md              — full product requirements, all features, all code patterns
2. SECURITY.md         — auth edge cases, SQL injection, payment security
3. SKILLS.md           — LangGraph patterns, agent prompt engineering, model routing
4. PERFORMANCE.md      — caching strategy, query optimisation, response targets
5. SYSTEM_DESIGN.md    — architecture decisions and trade-offs
6. FEATURE_BREAKDOWN.md — every feature specified precisely

PROJECT CONTEXT:
- StockSense is a two-layer platform: Layer 1 daily scanner + Layer 2 multi-agent research
- Backend: FastAPI (Python 3.11) + SQLAlchemy + PostgreSQL (Supabase)
- Agents: LangGraph 7-agent pipeline with Groq (free) + Gemini Flash (paid)
- Frontend: React 18 + TypeScript + TailwindCSS
- Payment: Paystack only (Nigerian market)
- Database: Supabase PostgreSQL (keep under 500MB with weekly cleanup)
- Cache: Upstash Redis
- Hosting: Render (API) + Vercel (Frontend) + GitHub Actions (scheduler)
- All free infrastructure — $0/month until paying users

CRITICAL RULES (never break these):
1. Never write raw SQL with user input — always SQLAlchemy ORM
2. Never hardcode secrets — always settings.VARIABLE_NAME from config.py
3. Never upgrade user tier from Paystack callback URL — only from webhook
4. Always verify Paystack webhook HMAC-SHA512 signature before processing
5. Always check idempotency (gateway_event_id) before processing payment events
6. NGX prices above ₦10,000 are in kobo — divide by 100 (kobo/naira confusion)
7. Paystack amounts are in KOBO — multiply NGN × 100 before sending to API
8. System prompts are cached — put static content in system, dynamic in user prompt
9. Use Groq for Researcher/Macro/Regulatory agents (free), Gemini for Analyst/Critic/Arbiter
10. All agent outputs must be validated through 3-layer pipeline (parse → Pydantic → sanity)
11. Log everything with structlog — never log passwords, tokens, or card data
12. Budget guards are mandatory — check before every AI API call
13. Always return state from LangGraph agent functions
14. Ownership checks on all user data — filter by both id AND user_id

TECH STACK VERSIONS (use these exact versions):
Python 3.11, FastAPI 0.115.0, SQLAlchemy 2.0.36, Pydantic 2.10.0
LangGraph 0.2.60, LangChain 0.3.0, Groq 0.13.0
React 18.3.0, TypeScript 5.7.0, TailwindCSS 3.4.0
See requirements.txt for full list

CURRENT PHASE: [UPDATE THIS as you progress]
Phase 1 → Layer 1 scanner + Telegram briefing
Phase 2 → Auth + React dashboard
Phase 3 → LangGraph multi-agent pipeline
Phase 4 → Paystack payments + tier enforcement
Phase 5 → Advanced features + accuracy tracker

When I give you a task:
1. State which file(s) you will create or modify
2. State which section of PRD.md is relevant
3. Write the code following all conventions in this document
4. After writing, state what to test
```

---

## Phase-by-Phase Build Instructions

Copy the relevant section below when starting each phase.

---

### PHASE 1 — Layer 1 Scanner
*Goal: Personal daily Telegram briefing, $0 cost, GitHub Actions automated*

```
Task: Build the Layer 1 daily scanner.

Files to create:
- config.py (Pydantic Settings, all env vars validated on startup)
- scanner/us_scanner.py (yfinance fetch + prefilter)
- scanner/ngx_scanner.py (scraper + NGX data cleaning)
- scanner/daily_analyst.py (Groq Llama 3.1-8b signal generation)
- scanner/main.py (orchestrates scan + sends Telegram)
- services/telegram_service.py (format + send morning briefing)
- .github/workflows/daily_scan.yml (scheduled at market open)
- tests/test_scanner.py (test prefilter logic)

Reference: PRD.md Section 6 (Layer 1 Scanner) and Section 14 (Telegram)
Reference: SKILLS.md Section 4 (Groq Integration)
Reference: SECURITY.md Section 9 (AI Hallucination Guards)

When complete I should be able to:
1. Run: python scanner/main.py
2. Receive a Telegram message with today's top picks
3. See signals stored in the signals table

Do NOT build yet:
- Any auth or user management
- Any FastAPI routes
- Any LangGraph agents
- Any frontend
```

---

### PHASE 2 — Auth + Dashboard
*Goal: Multi-user, deployed, first real users*

```
Task: Build authentication system and React dashboard.

Backend files to create:
- main.py (FastAPI app with all middleware)
- db/models.py (all SQLAlchemy models)
- db/session.py (engine, SessionLocal, get_db)
- db/crud.py (basic read/write operations)
- db/migrations/ (Alembic setup + initial migration)
- routers/auth.py (signup, login, logout, refresh, verify-email)
- routers/users.py (GET/PUT /users/me)
- routers/search.py (universal stock search)
- routers/signals.py (GET /signals — tier-limited)
- services/auth_service.py (JWT, bcrypt, Google OAuth)
- middleware/auth.py (JWT verification middleware)
- middleware/tier_guard.py (Free/Pro/Enterprise enforcement)
- middleware/rate_limit.py (slowapi setup)

Frontend files to create:
- frontend/src/api/client.ts (Axios with JWT interceptor)
- frontend/src/store/authStore.ts (Zustand auth state)
- frontend/src/pages/Landing.tsx (marketing page)
- frontend/src/pages/auth/Signup.tsx
- frontend/src/pages/auth/Login.tsx
- frontend/src/pages/Dashboard.tsx (signals feed + search bar)
- frontend/src/components/SearchBar/SearchBar.tsx
- frontend/src/components/SignalCard/SignalCard.tsx

Reference: PRD.md Section 11 (Authentication) and Section 12 (Stock Search)
Reference: SECURITY.md Section 1 (Auth Edge Cases) and Section 2 (JWT)
Reference: PRD.md Section 4 (Database Schema) for SQLAlchemy models

When complete I should be able to:
1. Sign up with email + password
2. Verify email
3. Log in and see dashboard with signal cards
4. Search for any US or NGX stock
5. Deploy to Render (API) + Vercel (frontend)
```

---

### PHASE 3 — Multi-Agent Pipeline
*Goal: Working Layer 2 deep analysis with streaming*

```
Task: Build the 7-agent LangGraph pipeline with SSE streaming.

Files to create:
- agents/state.py (AgentState dataclass — all fields)
- agents/graph.py (LangGraph graph definition)
- agents/orchestrator.py (query parser + router)
- agents/cleaning/ngx_cleaner.py (NGX data cleaning agent)
- agents/cleaning/us_cleaner.py (US data validation)
- agents/researcher.py (Groq 8b — data enrichment)
- agents/macro_agent.py (Groq 8b — macro context)
- agents/regulatory_agent.py (Groq 8b — filings + insider)
- agents/analyst_agent.py (Gemini 2.0 Flash — signal generation)
- agents/critic_agent.py (Gemini 2.0 Flash — challenge)
- agents/arbiter_writer.py (Gemini 2.5 Flash — final report)
- agents/validator.py (Python sanity checks)
- routers/analysis.py (POST /analysis/start + GET /analysis/stream/{id})
- services/cache_service.py (Redis cache + cache decision logic)
- services/budget_service.py (spend tracking + hard limits)
- services/streaming_service.py (SSE event management)
- frontend/src/hooks/useAnalysisStream.ts (SSE hook)
- frontend/src/components/AgentProgress/AgentProgress.tsx
- frontend/src/components/AnalysisReport/AnalysisReport.tsx
- frontend/src/pages/StockDetail.tsx (search result + analysis)

Reference: PRD.md Section 7 (Layer 2) and Section 8 (Agent Definitions)
Reference: PRD.md Section 9 (LangGraph Graph) and Section 16 (Streaming)
Reference: SKILLS.md Section 1 (LangGraph) and Section 6 (Parallel Execution)
Reference: SKILLS.md Section 7 (Output Validation) and Section 8 (NGX Data)

NGX-specific: agents/cleaning/ngx_cleaner.py must implement ALL 5 checks:
1. Stale price detection (consecutive unchanged days)
2. Kobo/naira confusion fix (prices >₦10,000 divided by 100)
3. Zero-volume handling (set to None, not 0)
4. RSI from trading days only (exclude zero-volume days)
5. Data reliability scoring (returns HIGH/MEDIUM/LOW/STALE)

When complete I should be able to:
1. Type "Analyse Zenith Bank" in the search bar
2. Click Deep Analysis (as a Pro user)
3. See the agent progress panel update in real time
4. Read the full report with Analyst + Critic + Arbiter views
5. Cost per analysis: under $0.01
```

---

### PHASE 4 — Paystack + Tier Enforcement
*Goal: First paying subscriber, full tier gating*

```
Task: Build Paystack payment integration and enforce tier limits.

Files to create:
- services/paystack_service.py (checkout + webhook processing)
- routers/billing.py (all /billing/* endpoints)
- frontend/src/components/UpgradeModal/UpgradeModal.tsx
- frontend/src/pages/Billing.tsx
- tests/test_paystack.py (test all payment edge cases)

Reference: PRD.md Section 13 (Payment System)
Reference: SECURITY.md Section 5 (Paystack Security)
Reference: PRD.md Section 10 (FastAPI Backend — /billing endpoints)

CRITICAL payment rules to implement:
1. ALWAYS verify HMAC-SHA512 signature before any processing
2. ALWAYS check idempotency (gateway_event_id in payment_events)
3. ALWAYS verify amount matches expected plan amount (fraud check)
4. NEVER upgrade tier from callback_url — only from webhook
5. ALWAYS save email_token from subscription.create webhook
6. Paystack amounts are in KOBO: ₦12,999 = 1,299,900 kobo
7. Handle all Paystack events: charge.success, subscription.create,
   subscription.disable, invoice.payment_failed

Tier enforcement (add to existing routes):
- GET /signals: apply TOP_PICKS_FREE limit for free users
- POST /analysis/start: check daily limit (3/day for Pro)
- GET /portfolio: live P&L only for Pro+
- GET /alerts: only for Pro+
- All features in FEATURE_BREAKDOWN.md Section 13 (tier matrix)

When complete:
1. Free user visits stock detail → sees UpgradeModal
2. User pays via Paystack → webhook fires → tier upgraded
3. User immediately can run deep analysis
4. Payment appears in billing history
5. User can cancel → access continues to period end
```

---

### PHASE 5 — Advanced Features + Accuracy Tracker
*Goal: Category-killer portfolio features, public accuracy dashboard*

```
Task: Build the 5 advanced features and signal accuracy tracker.

Files to create:
- agents/earnings_sentiment.py (earnings call NLP analysis)
- services/accuracy_service.py (signal outcome evaluation)
- routers/accuracy.py (GET /accuracy/* endpoints)
- frontend/src/pages/Accuracy.tsx (public accuracy dashboard)
- frontend/src/components/AccuracyChart/AccuracyChart.tsx
- .github/workflows/accuracy_eval.yml (daily evaluation job)
- scripts/db_cleanup.py (weekly Supabase storage cleanup)
- .github/workflows/db_cleanup.yml (weekly cleanup schedule)

Reference: FEATURE_BREAKDOWN.md Section 4 (5 Advanced Features)
Reference: PRD.md Section 18 (Signal Accuracy Tracker)
Reference: FEATURE_BREAKDOWN.md Section 8 (Accuracy Tracker)

Accuracy evaluation logic:
- Job runs daily (GitHub Actions cron: 0 6 * * *)
- Evaluates signals that are ≥30 days old with outcome='PENDING'
- BUY signal + price up >3% = CORRECT
- BUY signal + price down >3% = INCORRECT
- Price moved ±3% = NEUTRAL
- Same logic inverted for SELL signals

Public dashboard shows:
- Overall accuracy % (no auth required)
- By market (US vs NGX)
- By signal type (BUY/SELL/HOLD)
- By confidence tier (score <5, 5-7, 7-9, ≥9)
- "Based on X evaluated signals over 90 days"
- Methodology link

When complete:
1. Past signals are being evaluated daily
2. Public /accuracy page visible without login
3. Accuracy metrics updating daily
4. Weekly database cleanup keeping Supabase under 500MB
```

---

## Task Templates

Use these when giving Claude specific instructions:

### Adding a new endpoint
```
Add endpoint: [METHOD] [/path]
Purpose: [what it does]
Auth: [none / JWT / JWT + tier]
Tier: [free / pro / enterprise / admin]
Input: [request body schema]
Output: [response schema]
Reference: PRD.md Section [X]
Edge cases: [list any special cases]
```

### Adding a new agent
```
Add agent: [AgentName]
Role: [single sentence describing its job]
Model: [Groq model name / Gemini model name]
Inputs from state: [which state fields it reads]
Outputs to state: [which state field it writes]
System prompt: [the exact system prompt text]
Output schema: [Pydantic model definition]
Reference: SKILLS.md Section 2 (Agent Prompt Patterns)
```

### Fixing a bug
```
Bug: [describe what's wrong]
File: [which file]
Current behaviour: [what happens]
Expected behaviour: [what should happen]
Related: [any PRD/SECURITY/SKILLS section]
```

### Adding a frontend component
```
Component: [ComponentName]
Page: [which page it goes on]
Props: [TypeScript interface]
Behaviour: [what it does]
Tier gating: [shown to which tiers]
Design notes: [any specific UI requirements]
```

---

## Common Questions to Ask Claude

When you're unsure about something, ask Claude these:

**Architecture questions:**
- "Which section of PRD.md covers [feature]?"
- "What's the correct way to handle [NGX edge case] according to SKILLS.md?"
- "Does this implementation follow the security rules in SECURITY.md?"

**Cost questions:**
- "Which model should [agent] use and why?"
- "Will this implementation stay within the budget guards?"
- "What's the expected cost per analysis for this implementation?"

**Security questions:**
- "Is there an SQL injection risk in this query?"
- "Does this auth flow handle all edge cases from SECURITY.md?"
- "Is the Paystack webhook handler following all the rules?"

**Testing questions:**
- "What should I test for this feature?"
- "Which edge cases from PRD.md should have test coverage?"
- "How do I test the Paystack webhook without a real payment?"

---

## Project Status Tracking

Update this section as you build:

```
PHASE 1 — Layer 1 Scanner
[ ] config.py
[ ] scanner/us_scanner.py
[ ] scanner/ngx_scanner.py
[ ] scanner/daily_analyst.py
[ ] scanner/main.py
[ ] services/telegram_service.py
[ ] .github/workflows/daily_scan.yml
[ ] Deployed to GitHub Actions
[ ] Receiving daily Telegram briefings

PHASE 2 — Auth + Dashboard
[ ] FastAPI app (main.py)
[ ] SQLAlchemy models (db/models.py)
[ ] Alembic migrations
[ ] Auth routes + JWT
[ ] Stock search endpoint
[ ] React dashboard
[ ] Deployed: Render (API) + Vercel (frontend)
[ ] First real user signed up

PHASE 3 — Multi-Agent Pipeline
[ ] All 7 agents implemented
[ ] LangGraph graph wired
[ ] SSE streaming working
[ ] NGX data cleaning (all 5 checks)
[ ] Layer 2 analysis working end-to-end
[ ] Cache strategy implemented
[ ] Budget guards active

PHASE 4 — Payments
[ ] Paystack service
[ ] Webhook handler (all 5 events)
[ ] Tier enforcement on all routes
[ ] UpgradeModal in frontend
[ ] First paying subscriber

PHASE 5 — Advanced Features
[ ] Signal accuracy tracker
[ ] Public accuracy dashboard
[ ] Weekly DB cleanup
[ ] Earnings call sentiment
[ ] Macro cross-referencing
```

---

## Resume / Portfolio Notes

When presenting this project to recruiters or in interviews, emphasise:

**Talking points in order of impact:**

1. **LangGraph 7-agent investment committee** — "I built a multi-agent pipeline that simulates an investment committee — Analyst presents bull case, Critic challenges it, Arbiter resolves with documented reasoning. Mirrors real hedge fund workflows."

2. **NGX thin market handling** — "Nigerian NGX stocks have pathologies no US-focused tool handles — stale prices that look stable, kobo/naira unit confusion, RSI calculations on zero-volume days. I built a specific Data Cleaning Agent for this."

3. **Credit optimisation at <$0.005/analysis** — "I route different agents to different models. Free Groq for data extraction, Gemini Flash for reasoning. System prompt caching. LangGraph node-level caching. 80% of requests served from cache. Total: under half a cent per deep analysis."

4. **Public signal accuracy tracker** — "Every signal is tracked against the 30-day outcome and published publicly. Most AI finance products hide their performance. I publish mine — 69% overall, 74% for high-confidence signals."

5. **Production security** — "JWT with short-lived access tokens stored in memory only, refresh tokens as HttpOnly cookies, hashed in DB. Paystack webhook HMAC verification with idempotency checks. Rate limiting on every endpoint."

**GitHub README should link directly to:**
- The accuracy dashboard (shows confidence in your signals)
- A sample analysis report screenshot (shows the output quality)
- The architecture diagram (shows system design thinking)

---

*StockSense MASTER_PROMPT.md — v1.0.0*
*Update CURRENT PHASE at the top when you move phases*
```
