from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_groq, clean_json_response
import yfinance as yf
import json

SYSTEM_PROMPT = """You are the Researcher Agent for StockSense AI.
Your task is to enrich the raw market data with fundamental context and recent news analysis.
Output MUST be a JSON object with keys: summary (string), sentiment (float 0-1), key_developments (list)."""

async def researcher_agent(state: AgentState) -> Dict:
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append(f"> [RESEARCHER] Deep diving into {ticker} internals...")
    
    try:
        t = yf.Ticker(ticker)
        # Fetch data...
        info = t.info
        news = t.news[:3]
        
        user_prompt = f"Stock: {ticker}\nSummary: {info.get('longBusinessSummary')}\nNews: {json.dumps(news)}"
        
        raw_res = await call_groq(SYSTEM_PROMPT, user_prompt)
        res = clean_json_response(raw_res)
        
        return {
            "research_data": res.get("summary", "No summary found."),
            "news_sentiment": res.get("sentiment", 0.5),
            "logs": logs + ["> [RESEARCHER] Data enrichment complete."],
            "steps_completed": state.get("steps_completed", []) + ["researcher"]
        }
    except Exception as e:
        return {"logs": logs + [f"> [ERROR] Researcher node failed: {str(e)}"]}
