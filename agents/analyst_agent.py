from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_gemini, clean_json_response
from services.budget_service import record_spend
from groq import AsyncGroq
from config import settings
import structlog

log = structlog.get_logger()

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
        # Try Gemini first
        try:
            llm_response = await call_gemini(SYSTEM_PROMPT, str(context), model="gemini-1.5-flash")
            raw_res = llm_response["content"]
            res = clean_json_response(raw_res)
            model_used = "gemini-1.5-flash"

            # Record spending
            user_id = state.get("user_id")
            if user_id:
                await record_spend(user_id, "gemini-1.5-flash", llm_response["tokens_in"], llm_response["tokens_out"])
        except Exception as gemini_err:
            # Fallback to Groq if Gemini fails
            log.warning("Gemini failed, using Groq fallback", error=str(gemini_err))
            groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            response = await groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": str(context)},
                ],
                response_format={"type": "json_object"},
                max_tokens=1000,
                temperature=0.1,
            )
            raw_res = response.choices[0].message.content
            res = clean_json_response(raw_res)
            model_used = "groq-fallback"

        return {
            "analyst_output": res,
            "analyst_signal": res.get("signal", "HOLD"),
            "logs": logs + [f"> [ANALYST] Generated conviction score: {res.get('score', 'N/A')} ({model_used})"],
            "steps_completed": state.get("steps_completed", []) + ["analyst"]
        }
    except Exception as e:
        log.error("Analyst node failed completely", error=str(e))
        return {"logs": logs + [f"> [ERROR] Analyst node failed: {str(e)}"]}
