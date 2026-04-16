from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_gemini, clean_json_response

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
        # Using Gemini 2.0 Flash for superior reasoning and speed
        raw_res = await call_gemini(SYSTEM_PROMPT, str(context), model="gemini-2.0-flash")
        res = clean_json_response(raw_res)
        
        return {
            "final_recommendation": res.get("final_signal", "HOLD"),
            "report_data": res,
            "logs": logs + ["> [ARBITER] Report finalized and locked."],
            "steps_completed": state.get("steps_completed", []) + ["synthesizer"]
        }
    except Exception as e:
        return {"logs": logs + [f"> [ERROR] Arbiter node failed: {str(e)}"]}
