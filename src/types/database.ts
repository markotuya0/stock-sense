// Manual types for SignalDeck tables
// These supplement the auto-generated Supabase types

export interface Stock {
  id: string;
  user_id: string;
  ticker: string;
  name: string | null;
  sector: string | null;
  added_at: string;
}

export interface StockInsert {
  user_id: string;
  ticker: string;
  name?: string | null;
  sector?: string | null;
}

export interface StockPrice {
  id: string;
  stock_id: string;
  price: number;
  change_percent: number | null;
  change_amount: number | null;
  volume: number | null;
  high_52w: number | null;
  low_52w: number | null;
  market_cap: number | null;
  source: string;
  fetched_at: string;
}

export interface StockPriceInsert {
  stock_id: string;
  price: number;
  change_percent?: number | null;
  change_amount?: number | null;
  volume?: number | null;
  high_52w?: number | null;
  low_52w?: number | null;
  market_cap?: number | null;
  source?: string;
}

export interface NewsArticle {
  id: string;
  stock_id: string;
  headline: string;
  summary: string | null;
  source: string;
  url: string | null;
  published_at: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  sentiment_score: number | null;
  fetched_at: string;
}

export type AlertType = 
  | 'price_drop'
  | 'price_spike'
  | 'near_low'
  | 'near_high'
  | 'unusual_volume'
  | 'news_spike';

export interface Alert {
  id: string;
  user_id: string;
  stock_id: string;
  alert_type: AlertType;
  condition_value: number | null;
  condition_text: string | null;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at: string | null;
  is_read: boolean;
  message: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  stock_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type InsightType = 
  | 'news_summary'
  | 'movement_explanation'
  | 'sentiment_analysis'
  | 'qa_response';

export interface AIInsight {
  id: string;
  stock_id: string;
  insight_type: InsightType;
  prompt: string | null;
  response: string;
  model: string | null;
  tokens_used: number | null;
  created_at: string;
}

// Extended types for UI display
export interface StockWithPrice extends Stock {
  latestPrice?: StockPrice | null;
}
