from slowapi import Limiter
from slowapi.util import get_remote_address
from config import settings

# Key function uses IP address + user ID if available (future)
# For now, it's strictly per IP to prevent brute force.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL if settings.ENVIRONMENT == "production" else "memory://",
    default_limits=["100/minute"]
)
