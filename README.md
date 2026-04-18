# StockSense — AI Investment Intelligence Platform

Two-layer AI platform for African (NGX) and US stock market analysis.

## What It Does

**Layer 1: Daily Scanner** 🤖
- Automated daily scan of 500+ stocks
- AI-generated signals with conviction scores (0-9.9)
- Free tier: 3 picks/day

**Layer 2: Deep Research** 📊
- User-triggered on-demand analysis for any stock
- 7-agent LangGraph pipeline (Researcher → Macro → Technical → Risk → Analyst → Critic → Arbiter)
- Results streamed live in 8-15 seconds
- Pro tier: 3 analyses/day (₦12,999/month)

## Tech Stack

**Backend:** Python 3.11, FastAPI, SQLAlchemy, LangGraph, Groq, Gemini, Supabase PostgreSQL, Upstash Redis

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, Zustand, React Router

**Infrastructure:** Supabase (DB), Upstash (Cache), Render (API), Vercel (Frontend)

## Quick Start

### Backend
```bash
cd /home/markotuya/Documents/GitHub/stock-sense-1
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

See [SETUP.md](SETUP.md) for detailed setup and [TESTING_GUIDE.md](TESTING_GUIDE.md) for testing procedures.

## Project Structure

```
stock-sense-1/
├── main.py                    # FastAPI entry point
├── config.py                  # Environment configuration
├── agents/                    # 7-agent LangGraph system
├── routers/                   # API endpoints
├── services/                  # Business logic
├── db/                        # Database & models
├── scanner/                   # Daily market scan
├── middleware/                # Auth, rate limiting, security
├── scripts/                   # Utilities
└── frontend/                  # React application
```

## Pricing Tiers

| Feature | Free | Pro (₦12,999/mo) | Enterprise |
|---------|------|-----------------|------------|
| Daily picks | 3 | Unlimited | Unlimited |
| Deep analysis | ❌ | 3/day | Unlimited |
| Real-time alerts | ❌ | ✅ | ✅ |
| Portfolio tracking | View-only | Full | Full + API |

## Environment Variables

See `.env.example` for required variables:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (PostgreSQL)
- `GROQ_API_KEY` (Layer 1 analysis)
- `GOOGLE_API_KEY` (Layer 2 analysis)
- `UPSTASH_REDIS_REST_URL` (Caching & budget tracking)
- `TELEGRAM_BOT_TOKEN` (Optional: alerts)

## Core Features

✅ Layer 1 daily signals  
✅ Layer 2 deep research pipeline  
✅ Real-time SSE streaming  
✅ Tier-based access control  
✅ User authentication (Supabase)  
✅ Accuracy tracking  
✅ Portfolio management  

## Development

- **Testing:** See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Setup:** See [SETUP.md](SETUP.md)
- **Contributing:** Create a feature branch, test locally, submit PR

## Key Files

- `main.py` — FastAPI app, daily scan scheduler
- `agents/graph.py` — 7-agent pipeline definition
- `routers/signals.py` — Signal API endpoints
- `routers/analysis.py` — Deep research SSE endpoint
- `frontend/src/pages/StockDetailPage.tsx` — Signal detail view
- `frontend/src/features/signals/AnalysisTerminal.tsx` — Live pipeline viewer
