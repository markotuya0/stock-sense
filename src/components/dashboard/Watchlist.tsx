import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StockWithPrice } from "@/types/database";
import { StockCard } from "./StockCard";
import { AddStockDialog } from "./AddStockDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, RefreshCw } from "lucide-react";

interface WatchlistProps {
  stocks: StockWithPrice[];
  loading: boolean;
  onAddStock: (ticker: string, name?: string) => Promise<{ error: Error | null }>;
  onRemoveStock: (stockId: string) => void;
  onRefresh: () => void;
  onViewDetails?: (stockId: string) => void;
}

const WatchlistSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-4 pl-5">
        <div className="mb-3 flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="mb-4 flex items-baseline justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const Watchlist: React.FC<WatchlistProps> = ({
  stocks,
  loading,
  onAddStock,
  onRemoveStock,
  onRefresh,
  onViewDetails,
}) => {
  if (loading) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <WatchlistSkeleton />
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Your Watchlist is Empty
        </h2>
        <p className="mb-6 text-muted-foreground">
          Start tracking stocks by adding them to your watchlist.
        </p>
        <AddStockDialog onAddStock={onAddStock} />
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground md:text-xl">
            Your Watchlist
          </h2>
          <p className="text-sm text-muted-foreground">
            {stocks.length} {stocks.length === 1 ? "stock" : "stocks"} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <AddStockDialog onAddStock={onAddStock} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {stocks.map((stock, index) => (
            <StockCard
              key={stock.id}
              stock={stock}
              index={index}
              onRemove={onRemoveStock}
              onViewDetails={onViewDetails}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Watchlist;
