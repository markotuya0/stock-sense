from typing import Dict
import yfinance as yf
from .state import AgentState
import asyncio

async def technical_node(state: AgentState) -> Dict:
    """Layer 3: Technical Indicators. Uses cached yfinance data from researcher."""
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append(f"> [TECHNICAL] Calculating RSI and MACD for {ticker}...")

    try:
        # Use cached 6mo history from researcher node (avoids redundant API call)
        df = state.get("yfinance_history_6mo")
        if df is None or df.empty:
            # Fallback: fetch if not in state
            df = await asyncio.to_thread(lambda: yf.Ticker(ticker).history(period="6mo"))
        if len(df) < 30:
            return {"logs": logs + ["> [ERROR] Not enough data for technicals"]}

        # RSI Calc
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs)).iloc[-1]

        # MACD Calc
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        macd = (exp1 - exp2).iloc[-1]
        signal = (exp1 - exp2).ewm(span=9, adjust=False).mean().iloc[-1]

        score = 0.5
        if rsi < 30: score += 0.3 # Oversold
        if rsi > 70: score -= 0.2 # Overbought
        if macd > signal: score += 0.2 # Bullish crossover

        return {
            "rsi": float(rsi),
            "macd": {"macd": float(macd), "signal": float(signal)},
            "technical_score": min(1.0, max(0.0, score)),
            "logs": logs + [f"> [TECHNICAL] RSI: {rsi:.1f}, MACD: {'BULLISH' if macd > signal else 'BEARISH'}"],
            "steps_completed": state.get("steps_completed", []) + ["technical"]
        }
    except Exception as e:
        return {"logs": logs + [f"> [ERROR] Technical failed: {str(e)}"]}
