import structlog
from datetime import date
from config import settings

try:
    from upstash_redis import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

log = structlog.get_logger()

# Mixed model pricing per 1M tokens (Approx from PRD)
PRICING = {
    "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
    "gemini-2.0-flash-exp": {"input": 0.10, "output": 0.40},
    "gemini-2.5-flash-preview": {"input": 0.30, "output": 2.50},
}

_redis_client: Redis = None

def _get_redis() -> Redis:
    global _redis_client
    if not REDIS_AVAILABLE:
        return None
    if _redis_client is None:
        try:
            _redis_client = Redis(
                url=settings.UPSTASH_REDIS_REST_URL,
                token=settings.UPSTASH_REDIS_REST_TOKEN,
            )
        except Exception as e:
            log.error("Failed to initialize Redis for budget tracking", error=str(e))
            return None
    return _redis_client

async def record_spend(user_id: str, model: str, tokens_in: int, tokens_out: int) -> float:
    """Record estimated spend to Redis for daily budget tracking."""
    price_info = PRICING.get(model, PRICING["llama-3.1-8b-instant"])
    cost = (tokens_in / 1_000_000 * price_info["input"]) + (tokens_out / 1_000_000 * price_info["output"])

    log.info("Recording LLM spend",
             user_id=str(user_id),
             model=model,
             cost_usd=round(cost, 6),
             tokens_in=tokens_in,
             tokens_out=tokens_out)

    redis = _get_redis()
    if redis:
        try:
            key = f"spend:user:{user_id}:{date.today().isoformat()}"
            redis.incrbyfloat(key, cost)
            redis.expire(key, 86400)  # Expire after 1 day
        except Exception as e:
            log.warning("Failed to record spend in Redis", error=str(e))

    return cost

async def get_current_spend(user_id: str) -> float:
    """Get current daily spend for user from Redis."""
    redis = _get_redis()
    if not redis:
        return 0.0
    try:
        key = f"spend:user:{user_id}:{date.today().isoformat()}"
        spend = redis.get(key)
        return float(spend) if spend else 0.0
    except Exception as e:
        log.warning("Failed to get spend from Redis", error=str(e))
        return 0.0

async def check_budget(user_id: str, current_spend: float = None) -> bool:
    """Check if user has exceeded their daily budget."""
    if current_spend is None:
        current_spend = await get_current_spend(user_id)

    if current_spend >= settings.BUDGET_PER_USER_DAILY_USD:
        log.warning("User budget exceeded", user_id=str(user_id), spend=current_spend)
        return False
    return True
