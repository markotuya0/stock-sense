"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useStocks } from "@/hooks/useStocks";
import { Watchlist } from "@/components/dashboard/Watchlist";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  LogOut,
  Bell,
  Settings,
  Loader2,
  Moon,
  Sun,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const {
    stocks,
    loading: stocksLoading,
    addStock,
    removeStock,
    refreshPrices,
  } = useStocks();

  // Check initial theme
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate summary stats
  const totalStocks = stocks.length;
  const gainers = stocks.filter(
    (s) => (s.latestPrice?.change_percent ?? 0) > 0
  ).length;
  const losers = stocks.filter(
    (s) => (s.latestPrice?.change_percent ?? 0) < 0
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SignalDeck</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
              !
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your watchlist today.
            </p>
          </div>

          {/* Stats cards */}
          {totalStocks > 0 && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stocks</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalStocks}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gainers</p>
                    <p className="text-2xl font-bold text-accent">{gainers}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Losers</p>
                    <p className="text-2xl font-bold text-destructive">{losers}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Watchlist */}
          <Watchlist
            stocks={stocks}
            loading={stocksLoading}
            onAddStock={addStock}
            onRemoveStock={removeStock}
            onRefresh={refreshPrices}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
