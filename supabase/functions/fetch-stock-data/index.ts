import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Yahoo Finance API - using the free query endpoint
async function fetchYahooFinanceData(ticker: string): Promise<StockQuote | null> {
  try {
    console.log(`Fetching Yahoo Finance data for ${ticker}`);
    
    // Using Yahoo Finance v8 API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.chart?.error) {
      console.error(`Yahoo Finance chart error: ${data.chart.error.description}`);
      return null;
    }

    const result = data.chart?.result?.[0];
    if (!result) {
      console.error("No result from Yahoo Finance");
      return null;
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    // Get current price data
    const regularMarketPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = regularMarketPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    // Get 52-week high/low from historical data
    const highs = quote?.high?.filter((h: number | null) => h !== null) || [];
    const lows = quote?.low?.filter((l: number | null) => l !== null) || [];
    const high52w = Math.max(...highs);
    const low52w = Math.min(...lows.filter((l: number) => l > 0));
    
    // Get latest volume
    const volumes = quote?.volume || [];
    const latestVolume = volumes[volumes.length - 1] || 0;

    return {
      symbol: ticker.toUpperCase(),
      price: regularMarketPrice,
      change: change,
      changePercent: changePercent,
      volume: latestVolume,
      high52w: isFinite(high52w) ? high52w : regularMarketPrice * 1.3,
      low52w: isFinite(low52w) && low52w > 0 ? low52w : regularMarketPrice * 0.7,
      marketCap: meta.marketCap || 0,
      name: meta.shortName || meta.longName || ticker,
    };
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${ticker}:`, error);
    return null;
  }
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

    console.log(`Processing request for ticker: ${ticker}, stockId: ${stockId}`);

    // Fetch stock data from Yahoo Finance
    const stockData = await fetchYahooFinanceData(ticker);
    
    if (!stockData) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch data for ${ticker}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If stockId provided, save to database
    if (stockId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Update stock name if not set
      await supabase
        .from("stocks")
        .update({ name: stockData.name })
        .eq("id", stockId)
        .is("name", null);

      // Insert price snapshot
      const { error: insertError } = await supabase.from("stock_prices").insert({
        stock_id: stockId,
        price: stockData.price,
        change_percent: stockData.changePercent,
        change_amount: stockData.change,
        volume: stockData.volume,
        high_52w: stockData.high52w,
        low_52w: stockData.low52w,
        market_cap: stockData.marketCap,
        source: "yahoo",
      });

      if (insertError) {
        console.error("Error inserting price data:", insertError);
      } else {
        console.log(`Saved price snapshot for ${ticker}`);
      }
    }

    return new Response(JSON.stringify({ data: stockData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-stock-data function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
