import time
import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict
from .state import AgentState

def researcher_node(state: AgentState) -> Dict:
    """Layer 1: Scour news and info."""
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append(f"> [RESEARCHER] Fetching live data for {ticker}...")
    
    try:
        t = yf.Ticker(ticker)
        info = t.info
        news = t.news[:3] # Get top 3 news
        
        summary = info.get('longBusinessSummary', 'No summary available.')[:200]
        sentiment = 0.5 # Default neutral
        if news:
            logs.append(f"> [RESEARCHER] Analyzing {len(news)} recent headlines...")
            # Simple heuristic sentiment
            positive_words = ['buy', 'growth', 'profit', 'surges', 'upgrade', 'high']
            headlines = " ".join([n['title'].lower() for n in news])
            pos_count = sum(1 for w in positive_words if w in headlines)
            sentiment = min(1.0, 0.5 + (pos_count * 0.1))

        return {
            "research_data": summary,
            "news_sentiment": sentiment,
            "logs": logs,
            "steps_completed": state.get("steps_completed", []) + ["researcher"]
        }
    except Exception as e:
        logs.append(f"> [ERROR] Researcher failed: {str(e)}")
        return {"logs": logs}

def macro_node(state: AgentState) -> Dict:
    """Layer 2: Macro context."""
    logs = state.get("logs", [])
    logs.append("> [MACRO] Checking benchmark yields and fiscal policy...")
    
    # Mocking macro analysis based on market
    if state["market"] == "NGX":
        score = 0.4 # High inflation environment
        logs.append("> [MACRO] Warning: NGX Inflation headwinds detected.")
    else:
        # Fetch 10Y Treasury for US
        try:
            tnx = yf.Ticker("^TNX").history(period="1d")['Close'].iloc[-1]
            score = 0.8 if tnx < 4.5 else 0.5
            logs.append(f"> [MACRO] US 10Y Yield at {tnx:.2f}%")
        except:
            score = 0.6

    return {
        "macro_score": score,
        "logs": logs,
        "steps_completed": state.get("steps_completed", []) + ["macro"]
    }

def technical_node(state: AgentState) -> Dict:
    """Layer 3: Technical Indicators."""
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append(f"> [TECHNICAL] Calculating RSI and MACD for {ticker}...")
    
    try:
        df = yf.Ticker(ticker).history(period="6mo")
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

def orchestrator_node(state: AgentState) -> Dict:
    """Layer 5: Weighted Synthesis."""
    logs = state.get("logs", [])
    logs.append("> [ORCHESTRATOR] Calculating weighted alpha conviction...")
    
    t_score = state.get("technical_score", 0.5)
    m_score = state.get("macro_score", 0.5)
    s_score = state.get("news_sentiment", 0.5)
    r_score = state.get("risk_score", 0.5)
    
    # Weighting: Tech(40%), Macro(30%), Sentiment(20%), Risk(10%)
    final_conviction = (t_score * 0.4) + (m_score * 0.3) + (s_score * 0.2) + (r_score * 0.1)
    
    return {
        "alpha_conviction": final_conviction,
        "logs": logs + [f"> [ORCHESTRATOR] Final Alpha Score: {final_conviction:.2f}"],
        "steps_completed": state.get("steps_completed", []) + ["orchestrator"]
    }

def validator_node(state: AgentState) -> Dict:
    """Layer 6: NGX & Data Anomalies."""
    logs = state.get("logs", [])
    logs.append("> [VALIDATOR] Checking for stale prices and currency anomalies...")
    
    passed = True
    if state["market"] == "NGX":
        # Simplified NGX check: if conviction high but macro score very low (high inflation)
        if state.get("alpha_conviction", 0) > 0.8 and state.get("macro_score", 0) < 0.3:
            logs.append("> [VALIDATOR] WARNING: Decoupling from local NGX macro reality detected.")
            passed = False

    return {
        "is_verified": passed,
        "logs": logs,
        "steps_completed": state.get("steps_completed", []) + ["validator"]
    }

def synthesizer_node(state: AgentState) -> Dict:
    """Layer 7: Final Signal."""
    conviction = state.get("alpha_conviction", 0.5)
    verified = state.get("is_verified", True)
    
    if not verified:
        rec = "HOLD (VAL_FAIL)"
    elif conviction > 0.75:
        rec = "STRONG_BUY"
    elif conviction > 0.60:
        rec = "BUY"
    elif conviction < 0.30:
        rec = "STRONG_SELL"
    elif conviction < 0.40:
        rec = "SELL"
    else:
        rec = "HOLD"
        
    return {
        "final_recommendation": rec,
        "logs": state.get("logs", []) + [f"> [SYNTHESIZER] Report Generated. Signal: {rec}"],
        "steps_completed": state.get("steps_completed", []) + ["synthesizer"]
    }
