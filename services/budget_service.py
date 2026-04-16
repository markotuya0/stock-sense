import structlog
from datetime import date
from config import settings
from services.auth_service import log # Reusing the same log instance or import from config if better

log = structlog.get_logger()

# Mixed model pricing per 1M tokens (Approx from PRD)
PRICING = {
    "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
    "gemini-2.0-flash-exp": {"input": 0.10, "output": 0.40},
    "gemini-2.5-flash-preview": {"input": 0.30, "output": 2.50},
}

async def record_spend(user_id: str, model: str, tokens_in: int, tokens_out: int):
    """
    Record estimated spend in the logs and eventually Redis.
    In production, this would use Redis INCRBYFLOAT.
    """
    price_info = PRICING.get(model, PRICING["llama-3.1-8b-instant"])
    cost = (tokens_in / 1_000_000 * price_info["input"]) + (tokens_out / 1_000_000 * price_info["output"])
    
    log.info("Recording LLM spend", 
             user_id=str(user_id), 
             model=model, 
             cost_usd=round(cost, 6),
             tokens_in=tokens_in,
             tokens_out=tokens_out)
    
    # Logic for Redis tracking would go here
    # await redis.incrbyfloat(f"spend:user:{user_id}:{date.today()}", cost)
    return cost

async def check_budget(user_id: str, current_spend: float) -> bool:
    """Check if user has exceeded their daily budget."""
    if current_spend >= settings.BUDGET_PER_USER_DAILY_USD:
        log.warning("User budget exceeded", user_id=str(user_id), spend=current_spend)
        return False
    return True
