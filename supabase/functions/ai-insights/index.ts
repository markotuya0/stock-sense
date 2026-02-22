import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface AIRequest {
  type: "summarize_news" | "explain_movement" | "answer_question";
  ticker: string;
  stockId?: string;
  context?: {
    news?: Array<{ headline: string; source: string; sentiment: string }>;
    priceChange?: number;
    price?: number;
  };
  question?: string;
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
  
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is not configured");
  }

  console.log("Calling AI Gateway...");

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Unable to generate insight.";
}

function buildSystemPrompt(): string {
  return `You are a helpful financial analyst assistant for SignalDeck, a personal stock tracking dashboard. Your role is to:

1. Summarize news in plain English - no jargon, no fluff
2. Explain stock movements clearly and concisely
3. Provide balanced perspectives without making predictions
4. Be honest when information is limited

IMPORTANT RULES:
- Never predict future prices or recommend buy/sell actions
- Keep responses short (2-4 sentences for summaries, 3-5 for explanations)
- Use simple language that a beginner investor can understand
- Focus on facts and consensus, not speculation
- If asked about predictions, politely explain you don't make them

Your tone should be calm, informative, and educational.`;
}

function buildNewsPrompt(ticker: string, news: Array<{ headline: string; source: string; sentiment: string }>): string {
  const newsText = news
    .slice(0, 10)
    .map((n, i) => `${i + 1}. [${n.source}] ${n.headline} (${n.sentiment})`)
    .join("\n");

  return `Summarize the following news about ${ticker} in 2-3 sentences. Focus on the main themes and overall sentiment. Be concise and plain-English.

Recent News:
${newsText}`;
}

function buildMovementPrompt(
  ticker: string, 
  priceChange: number, 
  news: Array<{ headline: string; source: string; sentiment: string }>
): string {
  const direction = priceChange >= 0 ? "up" : "down";
  const changeStr = Math.abs(priceChange).toFixed(2);
  
  const newsText = news.length > 0
    ? news.slice(0, 5).map((n) => `- [${n.source}] ${n.headline}`).join("\n")
    : "No recent news available.";

  return `${ticker} is ${direction} ${changeStr}% today.

Recent headlines:
${newsText}

In 3-4 sentences, explain what might be driving this movement based on the news. Be balanced and avoid speculation. If no clear reason exists, say so.`;
}

function buildQuestionPrompt(
  ticker: string,
  question: string,
  context: { news?: Array<{ headline: string; source: string; sentiment: string }>; priceChange?: number }
): string {
  const newsText = context.news && context.news.length > 0
    ? context.news.slice(0, 5).map((n) => `- [${n.source}] ${n.headline} (${n.sentiment})`).join("\n")
    : "No recent news available.";

  const priceInfo = context.priceChange !== undefined
    ? `Current change: ${context.priceChange >= 0 ? "+" : ""}${context.priceChange.toFixed(2)}%`
    : "";

  return `The user is asking about ${ticker}.

${priceInfo}

Recent headlines:
${newsText}

User question: ${question}

Answer in 2-4 sentences using plain English. If you don't have enough information, be honest about it.`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AIRequest = await req.json();
    const { type, ticker, stockId, context, question } = body;

    if (!ticker || !type) {
      return new Response(
        JSON.stringify({ error: "ticker and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing AI request: ${type} for ${ticker}`);

    let userPrompt: string;
    let insightType: string;

    switch (type) {
      case "summarize_news":
        if (!context?.news || context.news.length === 0) {
          return new Response(
            JSON.stringify({ response: "No news available to summarize." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userPrompt = buildNewsPrompt(ticker, context.news);
        insightType = "news_summary";
        break;

      case "explain_movement":
        userPrompt = buildMovementPrompt(
          ticker,
          context?.priceChange || 0,
          context?.news || []
        );
        insightType = "movement_explanation";
        break;

      case "answer_question":
        if (!question) {
          return new Response(
            JSON.stringify({ error: "question is required for answer_question type" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userPrompt = buildQuestionPrompt(ticker, question, context || {});
        insightType = "qa_response";
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Call AI
    const systemPrompt = buildSystemPrompt();
    const response = await callAI(systemPrompt, userPrompt);

    console.log(`AI response generated for ${ticker}`);

    // Save to database if stockId provided
    if (stockId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("ai_insights").insert({
        stock_id: stockId,
        insight_type: insightType,
        prompt: userPrompt.substring(0, 1000),
        response: response,
        model: "google/gemini-2.5-flash",
      });

      console.log(`Saved AI insight to database for ${ticker}`);
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-insights function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
