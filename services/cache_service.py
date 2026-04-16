import structlog
from typing import Any, Optional
import time

log = structlog.get_logger()

# Cache Key Templates from PERFORMANCE.md
CACHE_CONFIG = {
    "us_price": {"ttl": 900, "key": "price:us:{symbol}"},
    "ngx_price": {"ttl": 1800, "key": "price:ng:{symbol}"},
    "layer1_signal": {"ttl": 14400, "key": "signal:l1:{market}:{symbol}"},
    "layer2_report": {"ttl": 14400, "key": "analysis:l2:{market}:{symbol}"},
}

class CacheService:
    _memory_store: dict[str, tuple[Any, float]] = {}

    @staticmethod
    def get_key(template_name: str, **kwargs) -> str:
        template = CACHE_CONFIG.get(template_name, {}).get("key", "default:{symbol}")
        return template.format(**kwargs)

    @staticmethod
    def get_ttl(template_name: str) -> int:
        return CACHE_CONFIG.get(template_name, {}).get("ttl", 3600)

    @staticmethod
    async def get(key: str) -> Optional[Any]:
        item = CacheService._memory_store.get(key)
        if not item:
            return None
        value, expires_at = item
        if expires_at < time.time():
            CacheService._memory_store.pop(key, None)
            return None
        return value

    @staticmethod
    async def set(key: str, value: Any, ttl: int):
        CacheService._memory_store[key] = (value, time.time() + ttl)
        log.debug("Cache stored", key=key, ttl=ttl)
