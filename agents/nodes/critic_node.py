from typing import Dict
from ..state import AgentState
import structlog

log = structlog.get_logger()

async def critic_node(state: AgentState) -> Dict:
    """Layer 6: Critic/Validator. Validates signal consistency across technical indicators and analyst recommendation."""
    ticker = state["ticker"]
    logs = state.get("logs", [])
    logs.append("> [CRITIC] Validating signal consistency...")

    try:
        # Extract data from state
        rsi = state.get("rsi", 50.0)
        analyst_signal = state.get("analyst_signal", "HOLD")  # From analyst node
        macro_score = state.get("macro_score", 0.5)
        technical_score = state.get("technical_score", 0.5)

        # Validate consistency
        consistency_issues = []
        confidence_adj = 1.0  # Multiplier for analyst confidence

        # Check for RSI extremes vs signal mismatch
        if rsi > 70 and analyst_signal == "BUY":
            consistency_issues.append(f"RSI overbought ({rsi:.1f}) but analyst says BUY")
            confidence_adj *= 0.7
        elif rsi < 30 and analyst_signal == "SELL":
            consistency_issues.append(f"RSI oversold ({rsi:.1f}) but analyst says SELL")
            confidence_adj *= 0.7

        # Check macro vs technical alignment
        if macro_score < 0.3 and technical_score > 0.7:
            consistency_issues.append("Bearish macro environment but bullish technicals")
            confidence_adj *= 0.8

        # Overall confidence rating
        if consistency_issues:
            confidence_msg = f"Issues detected: {'; '.join(consistency_issues)}"
        else:
            confidence_msg = "Signal consistent across indicators"

        return {
            "critic_output": {
                "consistency_issues": consistency_issues,
                "confidence_adjustment": confidence_adj,
                "validation_message": confidence_msg,
            },
            "logs": logs + [f"> [CRITIC] {confidence_msg}"],
            "steps_completed": state.get("steps_completed", []) + ["critic"]
        }
    except Exception as e:
        log.error("Critic node failed", error=str(e))
        return {
            "critic_output": {
                "consistency_issues": [],
                "confidence_adjustment": 1.0,
                "validation_message": "Unable to validate",
            },
            "logs": logs + [f"> [ERROR] Critic validation failed: {str(e)}"],
            "steps_completed": state.get("steps_completed", []) + ["critic"]
        }
