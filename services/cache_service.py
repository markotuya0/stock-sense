import structlog
from typing import Any, Optional
import json
from config import settings

try:
    from upstash_redis import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

log = structlog.get_logger()

# Cache Key Templates from PERFORMANCE.md
CACHE_CONFIG = {
    "us_price": {"ttl": 900, "key": "price:us:{symbol}"},
    "ngx_price": {"ttl": 1800, "key": "price:ng:{symbol}"},
    "layer1_signal": {"ttl": 14400, "key": "signal:l1:{market}:{symbol}"},
    "layer2_report": {"ttl": 14400, "key": "analysis:l2:{market}:{symbol}"},
}

class CacheService:
    _redis_client: Optional[Redis] = None
    _memory_store: dict[str, Any] = {}

    @classmethod
    def _get_redis(cls) -> Optional[Redis]:
        if not REDIS_AVAILABLE:
            return None
        if cls._redis_client is None:
            try:
                cls._redis_client = Redis(
                    url=settings.UPSTASH_REDIS_REST_URL,
                    token=settings.UPSTASH_REDIS_REST_TOKEN,
                )
            except Exception as e:
                log.error("Failed to initialize Redis", error=str(e))
                return None
        return cls._redis_client

    @staticmethod
    def get_key(template_name: str, **kwargs) -> str:
        template = CACHE_CONFIG.get(template_name, {}).get("key", "default:{symbol}")
        return template.format(**kwargs)

    @staticmethod
    def get_ttl(template_name: str) -> int:
        return CACHE_CONFIG.get(template_name, {}).get("ttl", 3600)

    @staticmethod
    async def get(key: str) -> Optional[Any]:
        redis = CacheService._get_redis()
        if redis:
            try:
                value = redis.get(key)
                if value:
                    return json.loads(value) if isinstance(value, str) else value
            except Exception as e:
                log.warning("Redis get failed, falling back to memory", key=key, error=str(e))

        return CacheService._memory_store.get(key)

    @staticmethod
    async def set(key: str, value: Any, ttl: int):
        redis = CacheService._get_redis()
        if redis:
            try:
                redis.setex(key, ttl, json.dumps(value) if not isinstance(value, str) else value)
                log.debug("Cache stored in Redis", key=key, ttl=ttl)
            except Exception as e:
                log.warning("Redis set failed, using memory", key=key, error=str(e))
                CacheService._memory_store[key] = value
        else:
            CacheService._memory_store[key] = value
            log.debug("Cache stored in memory", key=key, ttl=ttl)
