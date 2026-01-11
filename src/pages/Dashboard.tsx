"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  LogOut,
  Plus,
  Bell,
  Settings,
  Loader2,
} from "lucide-react";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
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
              Welcome back!
            </h1>
            <p className="text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>

          {/* Empty state for watchlist */}
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Your Watchlist is Empty
            </h2>
            <p className="mb-6 text-muted-foreground">
              Start tracking stocks by adding them to your watchlist.
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Stock
            </Button>
          </div>

          {/* Coming soon features */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Stock Tracking",
                description: "Multi-source price data with cross-validation",
                status: "Coming soon",
              },
              {
                title: "News Aggregation",
                description: "Headlines from Yahoo, Google, CNBC & more",
                status: "Coming soon",
              },
              {
                title: "AI Insights",
                description: "Plain English summaries and explanations",
                status: "Coming soon",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                  {feature.status}
                </div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
