from fastapi import Request, HTTPException, Depends
from .supabase_auth import get_supabase_user
import structlog

log = structlog.get_logger()


async def get_current_user(request: Request) -> dict:
    """
    Returns user dict from Supabase JWT.
    Replaces the old SQLAlchemy User-based authentication.
    """
    return await get_supabase_user(request)
