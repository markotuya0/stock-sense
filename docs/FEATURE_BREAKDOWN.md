# StockSense — FEATURE_BREAKDOWN.md
## Complete Feature Specification

> Every feature defined precisely. What it does, how it works,
> which tier it belongs to, and what the edge cases are.

---

## Table of Contents

1. [Stock Search & Discovery](#1-stock-search--discovery)
2. [Layer 1 — Daily Scanner](#2-layer-1--daily-scanner)
3. [Layer 2 — Deep Analysis](#3-layer-2--deep-analysis)
4. [The 5 Advanced Features](#4-the-5-advanced-features)
5. [Portfolio Tracking](#5-portfolio-tracking)
6. [Watchlist & Price Alerts](#6-watchlist--price-alerts)
7. [Telegram Alerts](#7-telegram-alerts)
8. [Signal Accuracy Tracker](#8-signal-accuracy-tracker)
9. [Financial Literacy Engine](#9-financial-literacy-engine)
10. [User Account & Settings](#10-user-account--settings)
11. [Billing & Subscriptions](#11-billing--subscriptions)
12. [Admin Dashboard](#12-admin-dashboard)
13. [Feature Tier Matrix](#13-feature-tier-matrix)

---

## 1. Stock Search & Discovery

### What it does
Universal search bar at the top of every dashboard page. Users type any symbol or company name and see matching US and NGX stocks in real time. This is the entry point for all Layer 2 deep analysis.

### How it works

```
User types "dan" →
  Debounce 300ms →
  GET /search?q=dan&limit=10 →
  PostgreSQL full-text search across stocks table →
  Returns: [DANGCEM, DANGSUGAR, DANGSALT, DANGOIL, ...] →
  Dropdown shows: symbol + company name + exchange flag + latest signal badge
```

### Search result card
```
🇳🇬 DANGCEM          Dangote Cement Plc          NGX
     ₦680.00 (+1.5%)  🟢 BUY  Score: 7.4/10

🇺🇸 AAPL             Apple Inc.                  NASDAQ
     $213.49 (+0.9%)  🟢 BUY  Score: 8.1/10
```

### Stock detail page (after selection)
- Company name, symbol, exchange badge
- Current price + today's change %
- 30-day price chart (Recharts line chart)
- Latest Layer 1 signal card (if generated today)
- "Deep Analysis" button
  - Free/Starter → shows UpgradeModal with Paystack checkout
  - Pro/Enterprise → starts analysis immediately
- "Add to Watchlist" button
- Recent signal history (last 5 signals)

### Edge cases
- Symbol not in our database: show "Stock not found. We support NYSE, NASDAQ, and NGX listed stocks."
- Search returns zero results: show "No results for '{query}'. Try the full company name or ticker symbol."
- NGX stock with no recent price data: show last known price with "⚠️ Last updated {date}"
- User searches crypto or forex: show "Crypto analysis coming soon — search US or NGX stocks"

---

## 2. Layer 1 — Daily Scanner

### What it does
Automated daily market scan that runs at market open every weekday. Scans 500+ US stocks and all NGX listed equities. Pre-filters to the highest-opportunity candidates. Generates AI buy/sell signals. Sends personalised Telegram briefings.

### Schedule
```
9:35 AM ET   Monday–Friday  →  US market scan (NYSE + NASDAQ)
10:05 AM WAT Monday–Friday  →  NGX scan (Nigerian Exchange)
7:00 AM UTC  Daily          →  Crypto scan
```

### Pre-filter logic
Before sending any stock to AI, it must pass all four gates:
1. Price gate: US ≥ $1.00 / NGX ≥ ₦10 (removes penny stocks)
2. Volume gate: today's volume ≥ 50% of 20-day average (something happening)
3. Momentum gate: price moved at least 1.5% today (US) or 1.0% (NGX)
4. Data gate: must have at least close price for today (rejects missing data)

Typical result: 15–25 candidates from 500+ stocks

### Signal generation
Each candidate is sent to Groq llama-3.1-8b-instant in batches of 5.
Output per stock:
- Signal: STRONG_BUY / BUY / HOLD / SELL / STRONG_SELL
- Score: 0.1–9.9
- Price target: realistic range (max +100% / min -60% from current)
- Risk score: 1–10
- Reason: one professional sentence
- Beginner note: one plain-English sentence
- Learn term: one financial term explained

### What each tier receives
```
Free tier:    Top 3 picks · Weekly Telegram digest (Sundays)
Pro tier:     All picks · Daily Telegram morning briefing
Enterprise:   All picks · Daily briefing · Real-time alerts on score ≥8
```

### Edge cases
- Market closed (holiday/weekend): scan skipped, no Telegram sent
- All stocks fail pre-filter (very rare): send "Markets quiet today — no strong signals detected. Top movers by volume: [list]"
- Groq API down: retry 3×, then send raw price data with "AI analysis unavailable today"
- NGX scraper blocked: use cached prices from last successful scan with staleness banner
- GitHub Actions timeout (>15 min): log failure, skip that scan, next scheduled scan runs normally

---

## 3. Layer 2 — Deep Analysis

### What it does
On-demand deep research on any single US or NGX stock. User initiates, 7-agent pipeline runs, full institutional-grade report delivered in 8–15 seconds via real-time streaming.

### The analysis flow

**Step 1: User initiates**
- User on stock detail page clicks "Deep Analysis"
- System checks: tier, daily limit, budget, cache
- If cache fresh and price unchanged: serve cached report instantly
- Otherwise: start agent pipeline, return job_id

**Step 2: Live progress panel**
```
◈ Analysing ZENITHB...
✅ Data quality verified — HIGH · ₦38.50
⟳ Running research agents in parallel...
✅ Research complete — RSI=42, volume 1.4× average
✅ Macro analysis — CBN held at 27.25%, oil $73
✅ Regulatory — Director purchased ₦45M shares (6 days ago)
⟳ Analyst generating signal...
✅ Analyst: BUY — Score 7.1/10
⟳ Critic reviewing...
✅ Critic: 3 challenges raised
⟳ Arbiter resolving disagreement...
✅ Report ready
```

**Step 3: Final report — three tabs**

Tab 1: "Arbiter's Recommendation"
```
◈ ZENITH BANK (ZENITHB · NGX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL: BUY  Score: 6.6/10
Price target: ₦47.00 (+22.1%)  Risk: 6/10
Confidence: 71%  Data quality: HIGH

Arbiter reasoning:
Director insider signal and favourable rate environment
outweigh FX risk for a 6-12 month horizon. Score downgraded
from 7.1 to 6.6 to reflect Critic's NPL concern.
```

Tab 2: "The Debate"
```
📊 ANALYST VIEW — BUY (7.1/10)
[Full analyst reasoning]

🔴 CRITIC CHALLENGE
Challenge 1: High NPL ratio — CBN stress test pending
Challenge 2: USD/NGN at 1,580 creates FX loan book risk
Challenge 3: Q1 results unknown — binary risk event

⚖️ Arbiter sided with: ANALYST
Reason: Director buy outweighs short-term risks
```

Tab 3: "For Beginners"
```
In plain English:
Someone who works at Zenith Bank just bought ₦45M of their
own company's shares. That usually means they believe the
price will go up. There are some risks — the Nigerian economy
is uncertain right now — so only invest what you're
comfortable with.

📚 Learn: What is insider trading?
[Explanation]

⚠️ This is not financial advice.
```

**Step 4: User decision**
```
[✅ I agree — BUY]  [🔴 I side with Critic — HOLD]
Your decision is saved to your analysis history
```

### Daily limits
- Free: 0 deep analyses/day (upgrade required)
- Pro: 3 deep analyses/day (resets at midnight Lagos time)
- Enterprise: unlimited

### Cache behaviour
- Analysis cached for 4 hours in Redis
- Cache served if price moved <2% since last analysis
- Cache invalidated and fresh analysis run if price moved >2% or signal flipped
- Pro tip shown: "Showing cached analysis from 2 hours ago. Price unchanged (+0.3%). [Refresh Analysis]"

---

## 4. The 5 Advanced Features

### Feature 1: Earnings Call Sentiment Engine

**What:** Analyses language of earnings call transcripts/audio. Detects confidence shifts, hedging language, and analyst question hostility.

**Why it matters:** Tone of management language predicts earnings quality before the numbers are public. "We expect approximately..." signals less confidence than "We are projecting...". No NGX-focused tool does this.

**Implementation:**
- Source: earnings call transcripts from financial data providers
- Audio (where available): Whisper API transcription
- Analysis: Groq NLP — sentiment per speaker, hedging phrase detection
- Output: confidence score, quarter-over-quarter tone comparison, key phrases flagged

**What user sees:**
```
ZENITHB — Q4 2025 Earnings Call
Management tone: CAUTIOUS (down from CONFIDENT in Q3)
Hedging language detected: 8 instances
Key phrases: "subject to regulatory review", "approximately", "we expect to"
Analyst question hostility: MEDIUM (3 challenging questions)
vs Q3: Tone shifted negative — watch Q1 results
```

**Tier:** Pro and Enterprise only

---

### Feature 2: Macro Cross-Referencing Agent

**What:** Every analysis automatically contextualised against live macro data fetched fresh before each analysis run.

**Data fetched per analysis:**
- NGX stocks: CBN policy rate, Nigeria CPI, Brent crude, USD/NGN
- US stocks: Fed funds rate, US CPI, DXY dollar index
- Both: sector-specific regulatory environment

**Why it matters:** A banking stock analysis without knowing the CBN just raised rates is incomplete. A Seplat analysis without knowing oil price is useless. Macro context is not optional for financial analysis — it's foundational.

**Output in report:**
```
Macro Context for ZENITHB:
⚡ CBN held rates at 27.25% (last meeting: 2 weeks ago)
   Impact: POSITIVE for banking sector NIM
⚠️ Nigeria CPI: 33.4% (elevated)
   Impact: Pressure on consumer credit quality
⚠️ USD/NGN: 1,580 (weakened 8% in 90 days)
   Impact: FX loan book risk for banks with dollar exposure
✅ Banking sector regulatory: Stable (no new CBN directives)
Overall macro: NEUTRAL-NEGATIVE for Nigerian banks
```

---

### Feature 3: Portfolio Correlation & Concentration Risk

**What:** After each signal, a risk calculation shows how adding this stock would affect the user's existing portfolio.

**Calculations:**
- Correlation coefficient with each existing holding
- Sector concentration percentage after adding
- Value at Risk (VaR) at 95% confidence — 30-day
- Concentration risk flag if any single sector would exceed 35%

**Output:**
```
Portfolio Impact: Adding ZENITHB
Current bank exposure: 15% → New exposure: 28%
Correlation with GTCO (existing): 0.82 (HIGH)
⚠️ Adding this creates high concentration in banking sector
VaR (95%, 30-day): Portfolio loss could reach 12.4% in worst case
Recommendation: Starter size only — banking sector already represented
```

**Tier:** Pro and Enterprise

---

### Feature 4: Regulatory Intelligence Agent

**What:** Monitors and surfaces NGX filings, director dealings, and material announcements automatically.

**Sources:**
- NGX regulatory announcements feed
- SEC EDGAR (US stocks)
- Director/substantial shareholder transactions
- Earnings release calendar

**Why it matters:** Director buying ₦45M of their own company's shares 3 days before positive earnings is a signal most retail tools miss entirely. Insider transactions are legal and disclosed — they just require monitoring.

**Output:**
```
Regulatory Signals for ZENITHB:
🔔 INSIDER BUY: FO Agunloye (Director) purchased 2.1M shares
   Value: ₦44.9M · Date: 6 days ago · Type: Market purchase
🔔 PENDING: Q1 2026 results due in 14 days
   Previous Q4: EPS ₦4.20 (+18% YoY)
✅ No material adverse announcements in last 30 days
✅ No CBN regulatory actions against this institution
```

---

### Feature 5: Public Signal Accuracy Tracker

**What:** Every signal generated is tracked against the actual 30-day price outcome. Results published publicly on a dashboard that anyone can view without logging in.

**Why it matters (the bold move):** No competitor publishes their accuracy. Hiding performance metrics signals low confidence. Publishing them — even imperfect ones — signals intellectual honesty and engineering rigour. A hedge fund engineer reading your GitHub sees this and stops scrolling.

**How accuracy is measured:**
```python
MARGIN = 3.0  # ±3% counts as neutral, not wrong

BUY signal: price went up >3%   → CORRECT
            price went down >3% → INCORRECT
            moved ±3%           → NEUTRAL

SELL signal: price went down >3% → CORRECT
             price went up >3%   → INCORRECT
             moved ±3%           → NEUTRAL

Evaluation: 30 days after signal generation
```

**Public dashboard shows:**
```
◈ StockSense Signal Accuracy — Last 90 Days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
US Stocks:     BUY 71% ✓   SELL 68% ✓   Overall: 69%
NGX Stocks:    BUY 64% ✓   SELL 61% ✓   Overall: 62%
High confidence (score ≥7): 74% overall
Layer 2 Deep Analysis: 76%   Layer 1 Scanner: 66%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based on 847 evaluated signals · Updated daily
Better than random (50%). Not guaranteed. See methodology.
```

---

## 5. Portfolio Tracking

### What it does
Users manually log their trades. System tracks live P&L against current prices. Shows performance history.

### Free tier: view only
- Can see portfolio page
- Can manually enter holdings (symbol, shares, average cost)
- Shows static view — no live P&L calculation
- Upgrade prompt: "Unlock live P&L tracking with Pro"

### Pro tier: full tracking
- Live P&L calculated against current prices
- Today's change in portfolio value
- All-time return percentage
- Per-holding breakdown with gain/loss
- Trade log with full history

### Trade logging
```
POST /portfolio/trade
{
  symbol:    "ZENITHB",
  market:    "ng",
  action:    "BUY",
  quantity:  1000,
  price:     38.50,
  fee:       0,
  platform:  "bamboo",  // bamboo | binance | manual | other
  notes:     "following AI signal"
}
```

### P&L calculation
```
For each holding:
  current_value = current_price × shares
  cost_basis    = avg_cost × shares
  pnl           = current_value - cost_basis
  pnl_pct       = (pnl / cost_basis) × 100
  today_change  = (current_price - yesterday_price) × shares

Portfolio total:
  total_value   = sum of all current_values
  total_cost    = sum of all cost_bases
  total_pnl     = total_value - total_cost
  total_return  = (total_pnl / total_cost) × 100
```

---

## 6. Watchlist & Price Alerts

### Watchlist
Users save stocks to monitor. Watchlist appears on dashboard sidebar.

```
Tier limits:
Free:       10 stocks max
Pro:        25 stocks max
Enterprise: Unlimited
```

### Price alerts (Pro+ only)
User sets a price threshold — get Telegram alert when hit.

```
Types:
  above: alert when price goes ABOVE ₦50
  below: alert when price goes BELOW ₦35

Check frequency: every 30 minutes during market hours
Notification: Telegram message immediately when triggered

Example:
"🔔 Price Alert: ZENITHB crossed ₦50.00
 Current price: ₦50.40 (+0.8%)
 Your alert: above ₦50.00 ← triggered
 View full analysis → stocksense.app/stock/ZENITHB"

After triggering: alert marked inactive (re-enable manually)
```

```
Tier limits:
Starter:    5 active alerts max
Pro:        Unlimited alerts
Enterprise: Unlimited alerts
```

---

## 7. Telegram Alerts

### Connection flow
1. User goes to Settings → Notifications
2. Clicks "Connect Telegram"
3. Shown: "Message @StockSenseBot on Telegram to connect your account"
4. User messages the bot with /connect
5. Bot generates a verification code
6. User enters code on dashboard
7. Telegram chat_id linked to account

### Alert types by tier

| Alert | Free | Pro | Enterprise |
|---|---|---|---|
| Weekly digest (Sunday) | ✅ | ✅ | ✅ |
| Daily morning briefing | ❌ | ✅ | ✅ |
| Real-time strong signal (≥8) | ❌ | ✅ | ✅ |
| Price threshold alert | ❌ | ✅ | ✅ |
| Portfolio stop-loss alert | ❌ | ✅ | ✅ |
| Weekly portfolio report | ❌ | ❌ | ✅ |

### Message format (morning briefing)
```
◈ StockSense · Morning Briefing 📊
Monday 14 Apr · US + NGX Open
━━━━━━━━━━━━━━━━━━━━━━

🟢 STRONG BUY · NVDA · $875 (+2.1%)
   Score: 9.1/10 · Target: $1,050 · Risk: 6/10
   AI: Breakout above $860 resistance on record volume
   Plain English: NVDA makes the chips powering AI.
   Strong momentum today.

🟢 BUY · DANGCEM · ₦680 (+1.5%)
   Score: 7.4/10 · Target: ₦820 · Risk: 4/10
   AI: Infrastructure cycle driving cement demand
   Plain English: Nigeria is building a lot.
   Dangote benefits directly.

📚 Learn: RSI above 70 = possibly overpriced.
   RSI below 30 = possibly underpriced.
━━━━━━━━━━━━━━━━━━━━━━
⚠️ Not financial advice. Educational only.
⭐ Upgrade for real-time alerts → stocksense.app
```

### Edge cases
- User blocks the bot: catch Forbidden exception, set telegram_chat_id=NULL, stop sending
- Message too long (>4096 chars): truncate at 3900, append "See full report at stocksense.app"
- Telegram API down: retry 3×, queue for retry in 30 minutes, log to alert_log

---

## 8. Signal Accuracy Tracker

### Public page (/accuracy) — no auth required

Visible to anyone. Shows historical accuracy of all signals generated by StockSense. This is a trust-building feature — intellectual honesty about performance.

### What's tracked

Every signal generated (Layer 1 and Layer 2) automatically creates a signal_outcome record. An automated GitHub Actions job runs daily and evaluates signals that are ≥30 days old.

```
Evaluated dimensions:
- Market (US / NGX)
- Signal type (BUY / SELL / HOLD)
- Score range (<5, 5-7, 7-9, ≥9)
- Data quality (HIGH / MEDIUM / LOW)
- Analysis layer (1 / 2)
- Was there agent disagreement? (Layer 2 only)
```

### Dashboard breakdown
```
Overall accuracy last 90 days: 67%
Based on 847 evaluated signals

By market:
  🇺🇸 US:  69% (514 signals)
  🇳🇬 NGX: 62% (333 signals)

By signal type:
  BUY:  71% correct
  SELL: 66% correct
  HOLD: 58% correct (hardest to get right)

By confidence:
  High confidence (score ≥7): 74%
  Medium (5-7): 63%
  Low (<5): 51% (barely above random)

Methodology: [link to explanation page]
```

### Why low-confidence signals are shown

Hiding low-confidence signals would inflate accuracy numbers but mislead users. Showing everything — including where the system is weakest — is more honest and more useful.

---

## 9. Financial Literacy Engine

### What it does
Teaches users financial concepts through daily tips, a searchable glossary, and simple quizzes. Tied to real market activity — the term explained each day relates to something happening in the market.

### Daily tip
One financial term per day, explained simply with a real example from today's signals.

```
📚 Today's Learn — Relative Strength Index (RSI)

RSI measures how fast a stock's price is moving.

Above 70 → Stock may be overpriced (often a sell signal)
Below 30 → Stock may be underpriced (often a buy signal)

Today's example: NVDA has an RSI of 72. Our analyst flagged
this as a caution — the price has risen fast and may need
to rest before continuing higher.

[Take a quick quiz →]
```

### Glossary (/learn)
Searchable list of 50+ financial terms, each with:
- Plain English definition
- Professional definition
- Real example from markets
- Related terms

### Terms included
RSI, MACD, P/E Ratio, EPS, Market Cap, Volume, Volatility, Beta, Dividend, Yield, Support/Resistance, Breakout, Bull/Bear Market, Short Selling, Options, Hedge, Portfolio, Diversification, Risk-Adjusted Return, VaR, Stop Loss, Take Profit, Moving Average, Bollinger Bands, Candlestick, and more.

### Learning progress (Pro)
- Tracks which terms the user has read and quizzed
- Shows learning streak (days in a row)
- "You've learned 12/50 terms this month" progress indicator

---

## 10. User Account & Settings

### Profile settings
- Full name
- Email (verified)
- Avatar (upload or Google profile picture)
- Timezone (default: Africa/Lagos)
- Risk profile: Conservative / Balanced / Aggressive (affects signal tone)

### Notification settings
- Telegram: connect/disconnect
- Email digest: on/off
- Morning briefing time: respect user's timezone
- Alert frequency: immediate / batched hourly

### Connected accounts
- Google OAuth: connect/disconnect
- Telegram: connect/disconnect (see flow above)

### Data & privacy
- Download my data (GDPR)
- Delete my account (GDPR) — deletes everything except payment_events (legal requirement)

---

## 11. Billing & Subscriptions

### Plans

```
FREE
₦0/month — no card required
- 3 daily picks
- NGX + US markets
- Weekly Telegram digest
- 10-stock watchlist
- Public accuracy dashboard

PRO  ← Most popular
₦12,999/month or ₦116,999/year (save 25%)
- Unlimited daily picks
- 3 deep analyses per day
- Daily Telegram morning briefing
- Real-time alerts
- Live portfolio P&L
- Earnings call sentiment
- Macro cross-referencing
- 25-stock watchlist
- Price alerts (unlimited)

ENTERPRISE
₦49,999/month or ₦449,999/year (save 25%)
- Everything in Pro
- Unlimited deep analyses
- Regulatory intelligence
- Portfolio risk correlation
- REST API access
- Custom agent prompts
- Priority support
```

### Billing page behaviour
- Shows current plan with usage (e.g. "2 of 3 deep analyses used today")
- Upgrade/downgrade buttons
- Invoice history (last 12 months)
- Cancel subscription (takes effect at period end)
- "Your Pro access continues until 14 May" shown after cancellation

### Cancel behaviour
- User clicks Cancel
- System calls Paystack API to disable subscription
- subscription.cancel_at_period_end = True
- User keeps Pro access until current_period_end
- On that date: subscription.disable webhook received → tier downgraded to free
- Never downgrade immediately on cancel request

---

## 12. Admin Dashboard

### Access: admin tier only

Route: /admin (protected, 403 for all non-admin users)

### Metrics overview
```
Users:
  Total registered: 1,247
  Free: 1,089 (87%)
  Pro: 148 (12%)
  Enterprise: 10 (1%)
  New today: 23

Revenue (this month):
  MRR: ₦1,923,251
  New subscriptions: 34
  Churned: 8
  Net new MRR: ₦341,000

Signals:
  Generated today: 847
  US: 512 · NGX: 335
  Layer 2 analyses today: 203
  Cache hit rate: 78%

System health:
  API uptime: 99.94%
  Last scan: 9:35 AM ET (success)
  Groq rate limit usage: 23% of daily limit
  Platform spend today: $2.34 / $10.00 limit
```

### User management
- Search users by email
- View tier, created date, last login
- Manually upgrade/downgrade tier (for support)
- View user's subscription status
- Suspend/activate account

### Scan control
- View last 20 scan runs with status
- Manual scan trigger (rate limited: 1/hour)
- View scan logs

### Budget monitoring
- Today's Groq token usage vs daily limit
- Today's Gemini spend vs daily budget
- Monthly spend trend chart
- Alert thresholds: 50%, 80%, 100% of monthly budget

---

## 13. Feature Tier Matrix

| Feature | Free | Pro | Enterprise |
|---|:---:|:---:|:---:|
| **DISCOVERY** |
| Universal stock search (US + NGX) | ✅ | ✅ | ✅ |
| Stock detail page | ✅ | ✅ | ✅ |
| Real-time price display | ✅ | ✅ | ✅ |
| **LAYER 1 SCANNER** |
| Daily AI picks | 3 | All | All |
| Weekly Telegram digest | ✅ | ✅ | ✅ |
| Daily morning briefing | ❌ | ✅ | ✅ |
| Real-time strong signal alerts | ❌ | ✅ | ✅ |
| **LAYER 2 DEEP ANALYSIS** |
| Deep analysis (7-agent pipeline) | ❌ | 3/day | Unlimited |
| Streamed agent progress | ❌ | ✅ | ✅ |
| Analyst vs Critic debate | ❌ | ✅ | ✅ |
| Arbiter recommendation | ❌ | ✅ | ✅ |
| Beginner explanation | ❌ | ✅ | ✅ |
| **ADVANCED FEATURES** |
| Earnings call sentiment | ❌ | ✅ | ✅ |
| Macro cross-referencing | ❌ | ✅ | ✅ |
| Portfolio correlation & VaR | ❌ | ✅ | ✅ |
| Regulatory intelligence | ❌ | ❌ | ✅ |
| Signal accuracy dashboard | Public | Full history | Full + API |
| **PORTFOLIO & ALERTS** |
| Portfolio tracking | View only | Live P&L | Live + export |
| Trade logging | ❌ | ✅ | ✅ |
| Watchlist | 10 stocks | 25 stocks | Unlimited |
| Price alerts | ❌ | Unlimited | Unlimited |
| Portfolio stop-loss alerts | ❌ | ✅ | ✅ |
| Weekly portfolio health report | ❌ | ❌ | ✅ |
| **FINANCIAL LITERACY** |
| Daily term + explanation | ✅ | ✅ | ✅ |
| Full glossary | ✅ | ✅ | ✅ |
| Quizzes + progress tracking | ❌ | ✅ | ✅ |
| Personalised learning path | ❌ | ❌ | ✅ |
| **INTEGRATIONS** |
| Telegram alerts | Weekly only | Daily + real-time | Daily + real-time |
| REST API access | ❌ | ❌ | ✅ |
| Custom agent prompts | ❌ | ❌ | ✅ |
| **PRICING** |
| Monthly | ₦0 | ₦12,999 | ₦49,999 |
| Annual | ₦0 | ₦116,999 | ₦449,999 |
| Payment method | — | Paystack | Paystack |

---

*StockSense FEATURE_BREAKDOWN.md — v1.0.0*
