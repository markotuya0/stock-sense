"use client";

import React from "react";
import { motion } from "framer-motion";
import { StockWithPrice } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Trash2,
  Bell,
  FileText,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StockCardProps {
  stock: StockWithPrice;
  onRemove: (stockId: string) => void;
  onViewDetails?: (stockId: string) => void;
  index?: number;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  onRemove,
  onViewDetails,
  index = 0,
}) => {
  const price = stock.latestPrice;
  const isPositive = (price?.change_percent ?? 0) >= 0;
  
  const formatPrice = (value: number | null | undefined) => {
    if (value == null) return "—";
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return "—";
    const prefix = value >= 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}%`;
  };

  const formatVolume = (value: number | null | undefined) => {
    if (value == null) return "—";
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-accent/50 hover:shadow-lg"
    >
      {/* Accent bar based on price change */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 transition-colors",
          isPositive ? "bg-accent" : "bg-destructive"
        )}
      />

      <div className="p-4 pl-5">
        {/* Header with ticker and actions */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
              {stock.ticker.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{stock.ticker}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {stock.name || "—"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetails?.(stock.id)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Set Alert
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove(stock.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Price and change */}
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(price?.price)}
          </span>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium",
              isPositive
                ? "bg-accent/10 text-accent"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {formatPercent(price?.change_percent)}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">52W High</p>
            <p className="text-sm font-medium text-foreground">
              {formatPrice(price?.high_52w)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">52W Low</p>
            <p className="text-sm font-medium text-foreground">
              {formatPrice(price?.low_52w)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="text-sm font-medium text-foreground">
              {formatVolume(price?.volume)}
            </p>
          </div>
        </div>

        {/* Source badge */}
        {price?.source && (
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {price.source}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StockCard;
