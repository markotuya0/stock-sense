import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Bell } from "lucide-react";

export const DashboardPreview: React.FC = () => {
  // Static preview data for the landing page illustration
  const stocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 178.72, change: 2.34, isUp: true },
    { symbol: "TSLA", name: "Tesla, Inc.", price: 248.50, change: -3.21, isUp: false },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.91, change: 1.87, isUp: true },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.80, change: 0.92, isUp: true },
  ];

  return (
    <div className="flex h-[400px] flex-col bg-background p-4 md:h-[500px] md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground md:text-xl">
            Your Watchlist
          </h3>
          <p className="text-sm text-muted-foreground">4 stocks tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
            <Activity className="h-4 w-4 text-accent" />
          </div>
        </div>
      </div>

      <div className="grid flex-1 gap-3 md:grid-cols-2">
        {stocks.map((stock, index) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.4 }}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
                {stock.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground">{stock.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">
                ${stock.price.toFixed(2)}
              </p>
              <div
                className={`flex items-center justify-end gap-1 text-xs ${
                  stock.isUp ? "text-accent" : "text-destructive"
                }`}
              >
                {stock.isUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {stock.isUp ? "+" : ""}
                  {stock.change.toFixed(2)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <span className="text-sm">✨</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">AI Insight</p>
            <p className="text-xs text-muted-foreground">
              AAPL shows strong momentum with positive sentiment across recent
              news sources. Review the latest headlines for more context.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPreview;
