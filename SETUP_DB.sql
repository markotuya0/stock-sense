-- StockSense Supabase Setup Script
-- 1. Create a project on Supabase.com
-- 2. Open "SQL Editor" on the left sidebar
-- 3. Paste this entire script and click "Run"

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE', 'ADMIN')),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    telegram_chat_id TEXT UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUTH TOKENS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SIGNALS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    name TEXT,
    market TEXT NOT NULL CHECK (market IN ('US', 'NGX')),
    signal_type TEXT, -- 'STRONG_BUY', 'BUY', 'HOLD', etc.
    score FLOAT,
    price_at_signal FLOAT,
    price_target FLOAT,
    risk_score INTEGER,
    analysis JSONB, -- Stores reasons, beginner notes, learning terms
    is_layer2 BOOLEAN DEFAULT FALSE,
    deep_research JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEARCH HISTORY ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACCURACY RECORDS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accuracy_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    price_at_signal FLOAT,
    price_current FLOAT,
    accuracy_score FLOAT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
