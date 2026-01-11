import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsArticle {
  headline: string;
  summary: string | null;
  source: string;
  url: string;
  publishedAt: string | null;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
}

// Simple sentiment analysis based on keywords
function analyzeSentiment(text: string): { sentiment: "positive" | "neutral" | "negative"; score: number } {
  const positiveWords = [
    "surge", "soar", "gain", "rise", "jump", "rally", "beat", "exceed", "profit",
    "growth", "strong", "bullish", "upgrade", "record", "high", "positive", "success",
    "breakthrough", "innovative", "expand", "outperform", "optimistic", "boost"
  ];
  
  const negativeWords = [
    "fall", "drop", "decline", "plunge", "crash", "loss", "miss", "cut", "weak",
    "bearish", "downgrade", "low", "negative", "fail", "concern", "risk", "warning",
    "lawsuit", "investigation", "layoff", "recession", "debt", "sell-off", "tumble"
  ];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveCount++;
  }
  
  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return { sentiment: "neutral", score: 0.5 };
  
  const score = positiveCount / total;
  
  if (score > 0.6) return { sentiment: "positive", score };
  if (score < 0.4) return { sentiment: "negative", score };
  return { sentiment: "neutral", score };
}

// Parse RSS feed
async function parseRSSFeed(url: string, source: string, ticker: string): Promise<NewsArticle[]> {
  try {
    console.log(`Fetching RSS feed from ${source}: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`RSS fetch error for ${source}: ${response.status}`);
      return [];
    }

    const text = await response.text();
    const articles: NewsArticle[] = [];

    // Simple XML parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
    const descriptionRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i;
    const linkRegex = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;

    let match;
    const upperTicker = ticker.toUpperCase();
    
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      
      const titleMatch = titleRegex.exec(item);
      const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]*>/g, "") : "";
      
      // Filter for relevant articles (mention the ticker or company)
      if (!title.toUpperCase().includes(upperTicker) && 
          !item.toUpperCase().includes(upperTicker)) {
        continue;
      }

      const descMatch = descriptionRegex.exec(item);
      const description = descMatch 
        ? descMatch[1].trim().replace(/<[^>]*>/g, "").substring(0, 500) 
        : null;
      
      const linkMatch = linkRegex.exec(item);
      const link = linkMatch ? linkMatch[1].trim() : "";
      
      const dateMatch = pubDateRegex.exec(item);
      const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : null;

      const { sentiment, score } = analyzeSentiment(title + " " + (description || ""));

      articles.push({
        headline: title,
        summary: description,
        source,
        url: link,
        publishedAt,
        sentiment,
        sentimentScore: score,
      });
    }

    console.log(`Found ${articles.length} articles for ${ticker} from ${source}`);
    return articles;
  } catch (error) {
    console.error(`Error parsing RSS from ${source}:`, error);
    return [];
  }
}

// Fetch news from multiple sources
async function fetchNewsForStock(ticker: string): Promise<NewsArticle[]> {
  const feeds = [
    {
      url: `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`,
      source: "Yahoo Finance",
    },
    {
      url: `https://www.cnbc.com/id/10001147/device/rss/rss.html`,
      source: "CNBC",
    },
    {
      url: `https://feeds.marketwatch.com/marketwatch/topstories/`,
      source: "MarketWatch",
    },
  ];

  const allArticles: NewsArticle[] = [];

  // Fetch from all feeds in parallel
  const results = await Promise.allSettled(
    feeds.map((feed) => parseRSSFeed(feed.url, feed.source, ticker))
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Sort by date (newest first) and deduplicate by headline
  const seen = new Set<string>();
  const uniqueArticles = allArticles
    .sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .filter((article) => {
      const key = article.headline.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20); // Limit to 20 articles

  return uniqueArticles;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, stockId } = await req.json();
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: "Ticker is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching news for ticker: ${ticker}`);

    // Fetch news from multiple sources
    const articles = await fetchNewsForStock(ticker);
    
    console.log(`Found ${articles.length} total articles for ${ticker}`);

    // If stockId provided, save to database
    if (stockId && articles.length > 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Insert articles (upsert to avoid duplicates)
      for (const article of articles) {
        const { error } = await supabase.from("news_articles").upsert(
          {
            stock_id: stockId,
            headline: article.headline,
            summary: article.summary,
            source: article.source,
            url: article.url,
            published_at: article.publishedAt,
            sentiment: article.sentiment,
            sentiment_score: article.sentimentScore,
          },
          { onConflict: "stock_id,url", ignoreDuplicates: true }
        );

        if (error && !error.message.includes("duplicate")) {
          console.error("Error inserting article:", error);
        }
      }

      console.log(`Saved ${articles.length} articles to database for ${ticker}`);
    }

    return new Response(JSON.stringify({ data: articles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-news function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
