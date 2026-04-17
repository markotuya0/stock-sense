from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_groq, clean_json_response
from services.cache_service import CacheService
from services.budget_service import record_spend
import yfinance as yf
import json
import asyncio
import structlog

log = structlog.get_logger()

SYSTEM_PROMPT = """You are the Researcher Agent for StockSense AI.
Your task is to enrich the raw market data with fundamental context and recent news analysis.
Output MUST be a JSON object with keys: summary (string), sentiment (float 0-1), key_developments (list)."""

async def researcher_agent(state: AgentState) -> Dict:
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append(f"> [RESEARCHER] Fetching {ticker} fundamental data and market history...")

    try:
        # Fetch all yfinance data in thread pool (researcher, technical, risk all use this)
        # Avoids calling yfinance 3 times
        market = state.get("market", "US")
        cache_key_6mo = CacheService.get_key("layer1_signal", market=market, symbol=ticker)

        async def fetch_all_data():
            t = yf.Ticker(ticker)
            return {
                "info": t.info,
                "news": t.news[:3] if hasattr(t, 'news') and t.news else [],
                "history_6mo": t.history(period="6mo"),
                "history_1mo": t.history(period="1mo"),
            }

        # Check cache for historical data
        cached = await CacheService.get(cache_key_6mo)
        if cached:
            log.debug("Using cached yfinance data", ticker=ticker)
            data = cached
        else:
            data = await asyncio.to_thread(fetch_all_data)
            # Cache for 4 hours (14400s)
            await CacheService.set(cache_key_6mo, data, CacheService.get_ttl("layer1_signal"))
        info = data["info"]
        news = data["news"]

        user_prompt = f"Stock: {ticker}\nSummary: {info.get('longBusinessSummary', 'N/A')}\nNews: {json.dumps(news)}"

        llm_response = await call_groq(SYSTEM_PROMPT, user_prompt, max_tokens=1000)
        raw_res = llm_response["content"]
        res = clean_json_response(raw_res)

        # Record spending
        user_id = state.get("user_id")
        if user_id:
            await record_spend(user_id, "llama-3.1-8b-instant", llm_response["tokens_in"], llm_response["tokens_out"])

        return {
            "research_data": res.get("summary", "No summary found."),
            "news_sentiment": res.get("sentiment", 0.5),
            "yfinance_history_6mo": data["history_6mo"],
            "yfinance_history_1mo": data["history_1mo"],
            "logs": logs + ["> [RESEARCHER] Data enrichment complete."],
            "steps_completed": state.get("steps_completed", []) + ["researcher"]
        }
    except Exception as e:
        log.error("Researcher node failed", error=str(e))
        return {
            "research_data": "No summary found.",
            "news_sentiment": 0.5,
            "logs": logs + [f"> [ERROR] Researcher node failed: {str(e)}"],
            "steps_completed": state.get("steps_completed", []) + ["researcher"]
        }
