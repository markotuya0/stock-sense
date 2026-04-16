from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_groq, clean_json_response

SYSTEM_PROMPT = """You are the Macro Economics Agent for StockSense AI.
Your task is to provide macro context (inflation, interest rates, FX, oil) for the specific market.
Output MUST be a JSON object with keys: macro_score (float 0-1), description (string), key_risks (list)."""

async def macro_agent(state: AgentState) -> Dict:
    market = state["market"]
    logs = state.get("logs", [])
    logs.append(f"> [MACRO] Assessing {market} fiscal environment...")
    
    # In a real app, this would fetch current CBN/Fed rates first
    user_prompt = f"Market: {market}. Provide a current macro outlook for 2026."
    
    try:
        raw_res = await call_groq(SYSTEM_PROMPT, user_prompt)
        res = clean_json_response(raw_res)
        
        return {
            "macro_score": res.get("macro_score", 0.5),
            "logs": logs + ["> [MACRO] Fiscal assessment complete."],
            "steps_completed": state.get("steps_completed", []) + ["macro"]
        }
    except Exception as e:
        return {"logs": logs + [f"> [ERROR] Macro node failed: {str(e)}"]}
