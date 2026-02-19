import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Stock, StockInsert, StockPrice, StockWithPrice } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useStocks() {
  const [stocks, setStocks] = useState<StockWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStocks = useCallback(async () => {
    if (!user) {
      setStocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch stocks
      const { data: stocksData, error: stocksError } = await supabase
        .from("stocks")
        .select("*")
        .order("added_at", { ascending: false });

      if (stocksError) throw stocksError;

      // Fetch latest prices for each stock
      const stocksWithPrices: StockWithPrice[] = await Promise.all(
        (stocksData as Stock[]).map(async (stock) => {
          const { data: priceData } = await supabase
            .from("stock_prices")
            .select("*")
            .eq("stock_id", stock.id)
            .order("fetched_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...stock,
            latestPrice: priceData as StockPrice | null,
          };
        })
      );

      setStocks(stocksWithPrices);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch stocks");
      setError(error);
      toast({
        variant: "destructive",
        title: "Error loading stocks",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const addStock = useCallback(
    async (ticker: string, name?: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      const upperTicker = ticker.toUpperCase().trim();

      // Check if already exists
      const existing = stocks.find((s) => s.ticker === upperTicker);
      if (existing) {
        return { error: new Error(`${upperTicker} is already in your watchlist`) };
      }

      try {
        const stockInsert: StockInsert = {
          user_id: user.id,
          ticker: upperTicker,
          name: name || null,
        };

        const { data, error } = await supabase
          .from("stocks")
          .insert(stockInsert)
          .select()
          .single();

      if (error) {
          if (error.code === "23505") {
            return { error: new Error(`${upperTicker} is already in your watchlist`) };
          }
          throw error;
        }

        // Refetch to get the stock with price
        await fetchStocks();

        toast({
          title: "Stock added",
          description: `${upperTicker} has been added to your watchlist`,
        });

        return { data, error: null };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to add stock");
        toast({
          variant: "destructive",
          title: "Error adding stock",
          description: error.message,
        });
        return { error };
      }
    },
    [user, stocks, fetchStocks, toast]
  );

  const removeStock = useCallback(
    async (stockId: string) => {
      try {
        const stock = stocks.find((s) => s.id === stockId);
        
        const { error } = await supabase
          .from("stocks")
          .delete()
          .eq("id", stockId);

        if (error) throw error;

        setStocks((prev) => prev.filter((s) => s.id !== stockId));

        toast({
          title: "Stock removed",
          description: stock ? `${stock.ticker} has been removed from your watchlist` : "Stock removed",
        });

        return { error: null };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to remove stock");
        toast({
          variant: "destructive",
          title: "Error removing stock",
          description: error.message,
        });
        return { error };
      }
    },
    [stocks, toast]
  );

  const refreshPrices = useCallback(async () => {
    // For now, just refetch everything
    // Later this will call the edge function to fetch real prices
    await fetchStocks();
    toast({
      title: "Prices refreshed",
      description: "Stock prices have been updated",
    });
  }, [fetchStocks, toast]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return {
    stocks,
    loading,
    error,
    addStock,
    removeStock,
    refreshPrices,
    refetch: fetchStocks,
  };
}

