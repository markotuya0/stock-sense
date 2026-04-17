from typing import Dict
import yfinance as yf
import numpy as np
from .state import AgentState
import asyncio
import structlog

log = structlog.get_logger()

async def risk_node(state: AgentState) -> Dict:
    """Layer 4: Volatility and Liquidity. Uses cached yfinance data from researcher."""
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append("> [RISK] Analyzing volatility and liquidity depth...")

    try:
        # Use cached 1mo history from researcher node (avoids redundant API call)
        df = state.get("yfinance_history_1mo")
        if df is None or df.empty:
            # Fallback: fetch if not in state
            df = await asyncio.to_thread(lambda: yf.Ticker(ticker).history(period="1mo"))
        # Annualized Volatility
        returns = np.log(df['Close'] / df['Close'].shift(1))
        vol = returns.std() * np.sqrt(252)
        
        # Liquidity (Volume vs 20D Avg)
        avg_vol = df['Volume'].mean()
        curr_vol = df['Volume'].iloc[-1]
        liquidity_ratio = curr_vol / avg_vol
        
        risk_score = 1.0
        if vol > 0.40: risk_score -= 0.3
        if liquidity_ratio < 0.5: risk_score -= 0.3
        
        return {
            "volatility": float(vol),
            "risk_score": max(0.1, risk_score),
            "logs": logs + [f"> [RISK] Volatility: {vol:.2%}, Liquidity Ratio: {liquidity_ratio:.2f}"],
            "steps_completed": state.get("steps_completed", []) + ["risk"]
        }
    except Exception as e:
        log.error("Risk node failed", error=str(e))
        return {
            "risk_score": 0.5,
            "logs": logs + [f"> [ERROR] Risk calculation failed: {str(e)}"],
            "steps_completed": state.get("steps_completed", []) + ["risk"]
        }
