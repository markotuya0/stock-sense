import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  name: string;
}

interface NewsArticle {
  headline: string;
  summary: string | null;
  source: string;
  url: string;
  publishedAt: string | null;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
}

export function useStockData() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStockPrice = useCallback(
    async (ticker: string, stockId?: string): Promise<StockQuote | null> => {
      try {
        setLoading(true);
        

        const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
          body: { ticker, stockId },
        });

        if (error) {
          console.error("Error fetching stock data:", error);
          toast({
            variant: "destructive",
            title: "Failed to fetch stock data",
            description: error.message,
          });
          return null;
        }

        return data?.data || null;
      } catch (err) {
        console.error("Error in fetchStockPrice:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const fetchNews = useCallback(
    async (ticker: string, stockId?: string): Promise<NewsArticle[]> => {
      try {
        

        const { data, error } = await supabase.functions.invoke("fetch-news", {
          body: { ticker, stockId },
        });

        if (error) {
          console.error("Error fetching news:", error);
          return [];
        }

        return data?.data || [];
      } catch (err) {
        console.error("Error in fetchNews:", err);
        return [];
      }
    },
    []
  );

  const getAIInsight = useCallback(
    async (
      type: "summarize_news" | "explain_movement" | "answer_question",
      ticker: string,
      stockId?: string,
      context?: {
        news?: Array<{ headline: string; source: string; sentiment: string }>;
        priceChange?: number;
        price?: number;
      },
      question?: string
    ): Promise<string | null> => {
      try {
        

        const { data, error } = await supabase.functions.invoke("ai-insights", {
          body: { type, ticker, stockId, context, question },
        });

        if (error) {
          console.error("Error getting AI insight:", error);
          toast({
            variant: "destructive",
            title: "AI insight failed",
            description: error.message,
          });
          return null;
        }

        return data?.response || null;
      } catch (err) {
        console.error("Error in getAIInsight:", err);
        return null;
      }
    },
    [toast]
  );

  return {
    loading,
    fetchStockPrice,
    fetchNews,
    getAIInsight,
  };
}
