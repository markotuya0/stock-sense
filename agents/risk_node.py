from typing import Dict
import yfinance as yf
import numpy as np
from .state import AgentState

def risk_node(state: AgentState) -> Dict:
    """Layer 4: Volatility and Liquidity."""
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append("> [RISK] Analyzing volatility and liquidity depth...")
    
    try:
        df = yf.Ticker(ticker).history(period="1mo")
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
    except:
        return {"risk_score": 0.5, "logs": logs}
