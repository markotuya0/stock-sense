-- SignalDeck Database Schema
-- A personal AI-powered stock intelligence dashboard

-- =============================================
-- STOCKS TABLE (Watchlist) - CREATE FIRST
-- =============================================
CREATE TABLE public.stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT,
  sector TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique ticker per user
  UNIQUE(user_id, ticker)
);

-- Enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stocks
CREATE POLICY "Users can view their own stocks"
  ON public.stocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stocks"
  ON public.stocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stocks"
  ON public.stocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stocks"
  ON public.stocks FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTION (After stocks table exists)
-- =============================================
CREATE OR REPLACE FUNCTION public.user_owns_stock(_user_id uuid, _stock_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stocks
    WHERE id = _stock_id
      AND user_id = _user_id
  )
$$;

-- =============================================
-- STOCK_PRICES TABLE (Historical price snapshots)
-- =============================================
CREATE TABLE public.stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  price DECIMAL(12, 4) NOT NULL,
  change_percent DECIMAL(8, 4),
  change_amount DECIMAL(12, 4),
  volume BIGINT,
  high_52w DECIMAL(12, 4),
  low_52w DECIMAL(12, 4),
  market_cap BIGINT,
  source TEXT NOT NULL DEFAULT 'yahoo',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prices for their stocks"
  ON public.stock_prices FOR SELECT
  USING (public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can insert prices for their stocks"
  ON public.stock_prices FOR INSERT
  WITH CHECK (public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can delete prices for their stocks"
  ON public.stock_prices FOR DELETE
  USING (public.user_owns_stock(auth.uid(), stock_id));

CREATE INDEX idx_stock_prices_stock_id ON public.stock_prices(stock_id);
CREATE INDEX idx_stock_prices_fetched_at ON public.stock_prices(fetched_at DESC);

-- =============================================
-- NEWS_ARTICLES TABLE (Aggregated news)
-- =============================================
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  summary TEXT,
  source TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(5, 4),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stock_id, url)
);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view news for their stocks"
  ON public.news_articles FOR SELECT
  USING (public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can insert news for their stocks"
  ON public.news_articles FOR INSERT
  WITH CHECK (public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can delete news for their stocks"
  ON public.news_articles FOR DELETE
  USING (public.user_owns_stock(auth.uid(), stock_id));

CREATE INDEX idx_news_articles_stock_id ON public.news_articles(stock_id);
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);

-- =============================================
-- ALERTS TABLE
-- =============================================
CREATE TYPE public.alert_type AS ENUM (
  'price_drop',
  'price_spike', 
  'near_low',
  'near_high',
  'unusual_volume',
  'news_spike'
);

CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  alert_type public.alert_type NOT NULL,
  condition_value DECIMAL(12, 4),
  condition_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_stock_id ON public.alerts(stock_id);
CREATE INDEX idx_alerts_active ON public.alerts(is_active) WHERE is_active = true;

-- =============================================
-- NOTES TABLE (Personal journal)
-- =============================================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notes_stock_id ON public.notes(stock_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AI_INSIGHTS TABLE
-- =============================================
CREATE TYPE public.insight_type AS ENUM (
  'news_summary',
  'movement_explanation',
  'sentiment_analysis',
  'qa_response'
);

CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  insight_type public.insight_type NOT NULL,
  prompt TEXT,
  response TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insights for their stocks"
  ON public.ai_insights FOR SELECT
  USING (public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can insert insights for their stocks"
  ON public.ai_insights FOR INSERT
  WITH CHECK (public.user_owns_stock(auth.uid(), stock_id));

CREATE POLICY "Users can delete insights for their stocks"
  ON public.ai_insights FOR DELETE
  USING (public.user_owns_stock(auth.uid(), stock_id));

CREATE INDEX idx_ai_insights_stock_id ON public.ai_insights(stock_id);
CREATE INDEX idx_ai_insights_created_at ON public.ai_insights(created_at DESC);