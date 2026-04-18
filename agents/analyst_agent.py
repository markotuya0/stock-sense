from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_gemini, clean_json_response
from services.budget_service import record_spend

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
        llm_response = await call_gemini(SYSTEM_PROMPT, str(context), model="gemini-1.5-flash")
        raw_res = llm_response["content"]
        res = clean_json_response(raw_res)

        # Record spending
        user_id = state.get("user_id")
        if user_id:
            await record_spend(user_id, "gemini-2.0-flash-exp", llm_response["tokens_in"], llm_response["tokens_out"])

        return {
            "analyst_output": res,
            "analyst_signal": res.get("signal", "HOLD"),
            "logs": logs + [f"> [ANALYST] Generated conviction score: {res.get('score', 'N/A')}"],
            "steps_completed": state.get("steps_completed", []) + ["analyst"]
        }
    except Exception as e:
        return {"logs": logs + [f"> [ERROR] Analyst node failed: {str(e)}"]}
