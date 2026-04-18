from fastapi import Request, HTTPException, Depends
from .supabase_auth import get_supabase_user
from services.auth_service import decode_token
from db.session import get_db
from db.models import User
from sqlalchemy.orm import Session
import structlog

log = structlog.get_logger()


def _extract_token_from_header(request: Request) -> str:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]
    return None


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> dict:
    """
    Returns user dict from either local JWT or Supabase JWT.
    Tries local JWT first (from /auth/login), then falls back to Supabase.
    """
    token = _extract_token_from_header(request) or request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Try local JWT first
    payload = decode_token(token)
    if payload and payload.get("sub"):
        # Local JWT - look up user by email
        user = db.query(User).filter(User.email == payload["sub"]).first()
        if user and user.is_active:
            return {
                "id": str(user.id),
                "email": user.email,
                "tier": user.tier or "FREE",
                "role": "authenticated",
            }

    # Fall back to Supabase JWT
    try:
        return await get_supabase_user(request)
    except HTTPException:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
