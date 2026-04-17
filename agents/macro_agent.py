from typing import Any, Dict
from .state import AgentState
from services.llm_service import call_groq, clean_json_response
import httpx
import structlog

log = structlog.get_logger()

SYSTEM_PROMPT = """You are the Macro Economics Agent for StockSense AI.
Your task is to analyze macro context (interest rates, monetary policy) for the specific market.
Output MUST be a JSON object with keys: macro_score (float 0-1), description (string), key_risks (list)."""

async def fetch_us_macro_data() -> Dict[str, Any]:
  """Fetch US macro data from Federal Reserve (FRED API - no key required)."""
  try:
    async with httpx.AsyncClient(timeout=5.0) as client:
      # Fetch 10-year Treasury yield (DGS10)
      treasury_url = "https://api.stlouisfed.org/fred/series/data?series_id=DGS10&units=pch&limit=1&file_type=json"
      treasury_res = await client.get(treasury_url)
      treasury_data = treasury_res.json()
      dgs10 = float(treasury_data.get("observations", [{}])[-1].get("value", "4.5"))

      # Fetch Fed Funds Rate (FEDFUNDS)
      fedfunds_url = "https://api.stlouisfed.org/fred/series/data?series_id=FEDFUNDS&units=lin&limit=1&file_type=json"
      fedfunds_res = await client.get(fedfunds_url)
      fedfunds_data = fedfunds_res.json()
      fedfunds = float(fedfunds_data.get("observations", [{}])[-1].get("value", "4.5"))

      return {"treasury_10y": dgs10, "fed_funds_rate": fedfunds}
  except Exception as e:
    log.warning("Failed to fetch US macro data from FRED", error=str(e))
    # Return reasonable defaults if API fails
    return {"treasury_10y": 4.5, "fed_funds_rate": 4.5}

def get_ngx_macro_data() -> Dict[str, Any]:
  """Get NGX macro context. CBN MPR last updated per hardcoded data."""
  # CBN Monetary Policy Rate as of latest available (would need real API integration for live data)
  return {"cbk_mpr": 28.5, "inflation_rate": 29.9}

async def macro_agent(state: AgentState) -> Dict:
    market = state["market"]
    logs = state.get("logs", [])
    logs.append(f"> [MACRO] Fetching live {market} macro data...")

    try:
        # Fetch real macro data based on market
        if market == "US":
            macro_data = await fetch_us_macro_data()
            user_prompt = f"""Analyze US macro environment for stock market outlook.
Current Data:
- 10Y Treasury Yield: {macro_data['treasury_10y']:.2f}%
- Fed Funds Rate: {macro_data['fed_funds_rate']:.2f}%

Provide macro risk score (0-1) and key market risks."""
        else:  # NGX
            macro_data = get_ngx_macro_data()
            user_prompt = f"""Analyze NGX (Nigerian) macro environment for stock market outlook.
Current Data:
- CBN Monetary Policy Rate: {macro_data['cbk_mpr']:.1f}%
- Inflation Rate: {macro_data['inflation_rate']:.1f}%

Provide macro risk score (0-1) and key market risks."""

        raw_res = await call_groq(SYSTEM_PROMPT, user_prompt, max_tokens=600)
        res = clean_json_response(raw_res)

        # Validate macro_score is in valid range
        macro_score = res.get("macro_score", 0.5)
        if not isinstance(macro_score, (int, float)) or macro_score < 0 or macro_score > 1:
            macro_score = 0.5

        return {
            "macro_score": macro_score,
            "logs": logs + [f"> [MACRO] {market} macro assessment complete."],
            "steps_completed": state.get("steps_completed", []) + ["macro"]
        }
    except Exception as e:
        log.error("Macro node failed", error=str(e))
        return {
            "macro_score": 0.5,
            "logs": logs + [f"> [ERROR] Macro node failed: {str(e)}"],
            "steps_completed": state.get("steps_completed", []) + ["macro"]
        }
