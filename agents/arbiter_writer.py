from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_gemini, clean_json_response
from services.budget_service import record_spend
from groq import AsyncGroq
from config import settings
import structlog

log = structlog.get_logger()

SYSTEM_PROMPT = """You are the Senior Research Writer for StockSense AI.
Your task is to compile the final institutional-grade report.
Include a professional version and a 'Beginner Note' version.
Arbiter decision must be final.
Output MUST be a JSON object with keys: professional_report (string), beginner_report (string), final_signal (string)."""

async def arbiter_writer_agent(state: AgentState) -> Dict:
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append(f"> [ARBITER] Finalizing institutional report for {ticker}...")
    
    context = {
        "analyst_view": state.get("analyst_output"),
        "macro": state.get("macro_score"),
        "ticker": ticker
    }
    
    try:
        # Try Gemini first
        try:
            llm_response = await call_gemini(SYSTEM_PROMPT, str(context), model="gemini-2.0-flash")
            raw_res = llm_response["content"]
            res = clean_json_response(raw_res)
            model_used = "gemini-2.0-flash"

            # Record spending
            user_id = state.get("user_id")
            if user_id:
                await record_spend(user_id, "gemini-2.0-flash", llm_response["tokens_in"], llm_response["tokens_out"])
        except Exception as gemini_err:
            # Fallback to Groq if Gemini fails
            log.warning("Gemini failed, using Groq fallback for arbiter", error=str(gemini_err))
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
            "final_recommendation": res.get("final_signal", "HOLD"),
            "report_data": res,
            "logs": logs + [f"> [ARBITER] Report finalized and locked ({model_used})."],
            "steps_completed": state.get("steps_completed", []) + ["synthesizer"]
        }
    except Exception as e:
        log.error("Arbiter node failed completely", error=str(e))
        return {"logs": logs + [f"> [ERROR] Arbiter node failed: {str(e)}"]}
