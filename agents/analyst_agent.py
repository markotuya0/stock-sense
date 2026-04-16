from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_gemini, clean_json_response

SYSTEM_PROMPT = """You are the Lead Investment Analyst for StockSense AI.
Using technicals, macro, and research data, you must generate a high-conviction signal.
Output MUST be a JSON object with keys: signal (string: BUY/HOLD/SELL), score (float 0.1-9.9), reasoning (string)."""

async def analyst_agent(state: AgentState) -> Dict:
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append(f"> [ANALYST] Synthesizing all data layers for {ticker}...")
    
    # Constructing the dynamic context
    context = {
        "ticker": ticker,
        "research": state.get("research_data"),
        "macro": state.get("macro_score"),
        "technicals": {
            "rsi": state.get("rsi"),
            "macd": state.get("macd")
        }
    }
    
    try:
        # Using Gemini for reasoning
        raw_res = await call_gemini(SYSTEM_PROMPT, str(context), model="gemini-1.5-flash")
        res = clean_json_response(raw_res)
        
        return {
            "analyst_output": res,
            "logs": logs + [f"> [ANALYST] Generated conviction score: {res.get('score', 'N/A')}"],
            "steps_completed": state.get("steps_completed", []) + ["analyst"]
        }
    except Exception as e:
        return {"logs": logs + [f"> [ERROR] Analyst node failed: {str(e)}"]}
