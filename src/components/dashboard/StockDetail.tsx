"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStockData } from "@/hooks/useStockData";
import { useAuth } from "@/contexts/AuthContext";
import { StockWithPrice, NewsArticle, Note, AIInsight } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Newspaper,
  FileText,
  Send,
  ExternalLink,
  Loader2,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StockDetailProps {
  stock: StockWithPrice;
  onBack: () => void;
  onRefresh: () => void;
}

export const StockDetail: React.FC<StockDetailProps> = ({
  stock,
  onBack,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchStockPrice, fetchNews, getAIInsight } = useStockData();
  
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [newNote, setNewNote] = useState("");
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [askingQuestion, setAskingQuestion] = useState(false);

  const price = stock.latestPrice;
  const isPositive = (price?.change_percent ?? 0) >= 0;

  // Load data on mount
  useEffect(() => {
    loadNews();
    loadNotes();
    loadInsights();
  }, [stock.id]);

  const loadNews = async () => {
    setLoadingNews(true);
    try {
      // First try to get from database
      const { data: dbNews } = await supabase
        .from("news_articles")
        .select("*")
        .eq("stock_id", stock.id)
        .order("published_at", { ascending: false })
        .limit(20);

      if (dbNews && dbNews.length > 0) {
        setNews(dbNews as unknown as NewsArticle[]);
      } else {
        // Fetch fresh news
        await refreshNews();
      }
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setLoadingNews(false);
    }
  };

  const refreshNews = async () => {
    setLoadingNews(true);
    try {
      const articles = await fetchNews(stock.ticker, stock.id);
      if (articles.length > 0) {
        // Reload from database after fetching
        const { data } = await supabase
          .from("news_articles")
          .select("*")
          .eq("stock_id", stock.id)
          .order("published_at", { ascending: false })
          .limit(20);
        
        if (data) {
          setNews(data as unknown as NewsArticle[]);
        }
      }
    } catch (error) {
      console.error("Error refreshing news:", error);
    } finally {
      setLoadingNews(false);
    }
  };

  const refreshPrice = async () => {
    setLoadingPrices(true);
    try {
      await fetchStockPrice(stock.ticker, stock.id);
      onRefresh();
      toast({
        title: "Price updated",
        description: `Latest price fetched for ${stock.ticker}`,
      });
    } catch (error) {
      console.error("Error refreshing price:", error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const loadNotes = async () => {
    try {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("stock_id", stock.id)
        .order("created_at", { ascending: false });
      
      if (data) {
        setNotes(data as unknown as Note[]);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const loadInsights = async () => {
    try {
      const { data } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("stock_id", stock.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (data) {
        setInsights(data as unknown as AIInsight[]);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim() || !user) return;
    
    setSavingNote(true);
    try {
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        stock_id: stock.id,
        content: newNote.trim(),
      });

      if (error) throw error;

      setNewNote("");
      loadNotes();
      toast({
        title: "Note saved",
        description: "Your note has been added",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        variant: "destructive",
        title: "Failed to save note",
      });
    } finally {
      setSavingNote(false);
    }
  };

  const summarizeNews = async () => {
    if (news.length === 0) {
      toast({
        title: "No news to summarize",
        description: "Refresh news first",
      });
      return;
    }

    setLoadingAI(true);
    try {
      const context = {
        news: news.slice(0, 10).map((n) => ({
          headline: n.headline,
          source: n.source,
          sentiment: n.sentiment || "neutral",
        })),
      };

      const response = await getAIInsight(
        "summarize_news",
        stock.ticker,
        stock.id,
        context
      );

      if (response) {
        setAiResponse(response);
        loadInsights();
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const explainMovement = async () => {
    setLoadingAI(true);
    try {
      const context = {
        news: news.slice(0, 5).map((n) => ({
          headline: n.headline,
          source: n.source,
          sentiment: n.sentiment || "neutral",
        })),
        priceChange: price?.change_percent || 0,
        price: price?.price || 0,
      };

      const response = await getAIInsight(
        "explain_movement",
        stock.ticker,
        stock.id,
        context
      );

      if (response) {
        setAiResponse(response);
        loadInsights();
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    setAskingQuestion(true);
    try {
      const context = {
        news: news.slice(0, 5).map((n) => ({
          headline: n.headline,
          source: n.source,
          sentiment: n.sentiment || "neutral",
        })),
        priceChange: price?.change_percent || 0,
      };

      const response = await getAIInsight(
        "answer_question",
        stock.ticker,
        stock.id,
        context,
        question
      );

      if (response) {
        setAiResponse(response);
        setQuestion("");
        loadInsights();
      }
    } finally {
      setAskingQuestion(false);
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {stock.ticker}
              </h1>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                  isPositive
                    ? "bg-accent/10 text-accent"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatPercent(price?.change_percent)}
              </span>
            </div>
            <p className="text-muted-foreground">{stock.name || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPrice}
            disabled={loadingPrices}
          >
            {loadingPrices ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Price
          </Button>
        </div>
      </div>

      {/* Price Card */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Current Price</p>
          <p className="text-3xl font-bold text-foreground">
            {formatPrice(price?.price)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">52-Week High</p>
          <p className="text-xl font-semibold text-foreground">
            {formatPrice(price?.high_52w)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">52-Week Low</p>
          <p className="text-xl font-semibold text-foreground">
            {formatPrice(price?.low_52w)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Source</p>
          <p className="text-xl font-semibold text-foreground capitalize">
            {price?.source || "—"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-2">
            <Newspaper className="h-4 w-4" />
            News ({news.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="h-4 w-4" />
            Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={summarizeNews}
              disabled={loadingAI || news.length === 0}
              className="h-auto justify-start p-4"
            >
              <Newspaper className="mr-3 h-5 w-5 text-accent" />
              <div className="text-left">
                <p className="font-medium">Summarize News</p>
                <p className="text-xs text-muted-foreground">
                  Get a plain-English summary of recent headlines
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={explainMovement}
              disabled={loadingAI}
              className="h-auto justify-start p-4"
            >
              <TrendingUp className="mr-3 h-5 w-5 text-accent" />
              <div className="text-left">
                <p className="font-medium">Explain Movement</p>
                <p className="text-xs text-muted-foreground">
                  Understand why the price changed
                </p>
              </div>
            </Button>
          </div>

          {/* Ask a question */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-accent" />
              <h3 className="font-medium">Ask a Question</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={`Ask anything about ${stock.ticker}...`}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askQuestion()}
              />
              <Button onClick={askQuestion} disabled={askingQuestion || !question.trim()}>
                {askingQuestion ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* AI Response */}
          {(loadingAI || aiResponse) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-accent/20 bg-accent/5 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-2">AI Insight</p>
                  {loadingAI ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aiResponse}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Previous insights */}
          {insights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Previous Insights</h3>
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-border bg-card/50 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs capitalize text-accent">
                      {insight.insight_type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {insight.response}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Latest news from Yahoo Finance, CNBC, and MarketWatch
            </p>
            <Button variant="outline" size="sm" onClick={refreshNews} disabled={loadingNews}>
              {loadingNews ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {loadingNews ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : news.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Newspaper className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No news found for {stock.ticker}</p>
              <Button variant="outline" className="mt-4" onClick={refreshNews}>
                Fetch News
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {article.source}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            article.sentiment === "positive"
                              ? "bg-accent/10 text-accent"
                              : article.sentiment === "negative"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {article.sentiment || "neutral"}
                        </span>
                      </div>
                      <h4 className="font-medium text-foreground mb-1 line-clamp-2">
                        {article.headline}
                      </h4>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      {article.published_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(article.published_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium mb-3">Add a Note</h3>
            <Textarea
              placeholder={`Write your thoughts about ${stock.ticker}...`}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <Button onClick={saveNote} disabled={savingNote || !newNote.trim()}>
              {savingNote ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Save Note
            </Button>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No notes yet. Start journaling!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
                    {note.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default StockDetail;
