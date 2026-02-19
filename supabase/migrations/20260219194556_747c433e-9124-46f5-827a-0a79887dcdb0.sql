-- Add unique constraint on news_articles for upsert to work correctly
CREATE UNIQUE INDEX IF NOT EXISTS news_articles_stock_id_url_unique ON public.news_articles (stock_id, url);