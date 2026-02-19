# SignalDeck

A personal AI-powered stock tracking dashboard that aggregates market data, news, and AI insights — helping you stay informed without the noise.

## What It Does

- **Stock Watchlist** — Track stocks with real-time prices, % change, and 52-week ranges from Yahoo Finance
- **News Aggregation** — Headlines from Yahoo Finance, CNBC, and MarketWatch with basic sentiment analysis
- **AI Insights** — Summarize news, explain price movements, and ask questions in plain English (powered by Google Gemini)
- **Personal Notes** — Journal your thoughts on each stock
- **Private Access** — Single-user dashboard with email/password authentication

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Lovable Cloud (Supabase) — PostgreSQL, Edge Functions, Auth
- **AI:** Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Data Sources:** Yahoo Finance API, RSS feeds (CNBC, MarketWatch)

## Features

| Feature | Status |
|---|---|
| Stock watchlist (add/remove) | ✅ |
| Real-time price data | ✅ |
| 52-week high/low | ✅ |
| News aggregation with sentiment | ✅ |
| AI news summaries | ✅ |
| AI movement explanations | ✅ |
| AI Q&A per stock | ✅ |
| Personal notes per stock | ✅ |
| Dark/light mode | ✅ |
| Mobile responsive | ✅ |
| Email/password auth | ✅ |

## Running Locally

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Environment Variables

The following are required and automatically configured by Lovable Cloud:

- `VITE_SUPABASE_URL` — Backend URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Public API key

Edge function secrets (configured in Lovable Cloud):

- `LOVABLE_API_KEY` — For AI insights
- `SUPABASE_SERVICE_ROLE_KEY` — For server-side database operations

## Architecture

```
src/
├── components/
│   ├── dashboard/    # StockCard, StockDetail, Watchlist, AddStockDialog
│   ├── landing/      # FloatingNav, ContainerScroll, FeatureCard, etc.
│   └── ui/           # shadcn/ui components
├── contexts/         # AuthContext
├── hooks/            # useStocks, useStockData
├── pages/            # Index, Auth, Dashboard, NotFound
└── types/            # Database types

supabase/
└── functions/
    ├── fetch-stock-data/   # Yahoo Finance price fetcher
    ├── fetch-news/         # RSS news aggregator
    └── ai-insights/        # AI summary & Q&A
```

## License

Personal use only.
