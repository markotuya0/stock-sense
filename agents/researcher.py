from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_groq, clean_json_response
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
        async def fetch_all_data():
            t = yf.Ticker(ticker)
            return {
                "info": t.info,
                "news": t.news[:3] if hasattr(t, 'news') and t.news else [],
                "history_6mo": t.history(period="6mo"),
                "history_1mo": t.history(period="1mo"),
            }

        data = await asyncio.to_thread(fetch_all_data)
        info = data["info"]
        news = data["news"]

        user_prompt = f"Stock: {ticker}\nSummary: {info.get('longBusinessSummary', 'N/A')}\nNews: {json.dumps(news)}"

        raw_res = await call_groq(SYSTEM_PROMPT, user_prompt, max_tokens=1000)
        res = clean_json_response(raw_res)

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
