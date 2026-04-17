from fastapi import HTTPException, Request
from jose import jwt, JWTError, jwk
from datetime import datetime
from typing import Optional
import structlog
import asyncio
import hashlib

from config import settings

log = structlog.get_logger()

SUPABASE_JWKS_URL: str = f"{settings.SUPABASE_URL}/auth/v1/jwt/jwks"

# Cache for JWKS keys
_jwks_cache: dict = {}
_jwks_cache_ts: float = 0
_JWKS_CACHE_TTL: float = 3600  # 1 hour


async def _fetch_jwks() -> dict:
    """Fetch JWKS from Supabase."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(SUPABASE_JWKS_URL)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        log.error("Failed to fetch Supabase JWKS", url=SUPABASE_JWKS_URL, error=str(e))
        raise HTTPException(status_code=503, detail="Auth service unavailable")


async def _get_cached_jwks() -> dict:
    """Get JWKS from cache or fetch fresh."""
    global _jwks_cache, _jwks_cache_ts
    now = datetime.utcnow().timestamp()
    if not _jwks_cache or (now - _jwks_cache_ts) > _JWKS_CACHE_TTL:
        _jwks_cache = await _fetch_jwks()
        _jwks_cache_ts = now
    return _jwks_cache


def _extract_token(request: Request) -> Optional[str]:
    """Extract token from Authorization header or query param (SSE-friendly)."""
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]
    return request.query_params.get("token") or request.query_params.get("access_token")


async def get_supabase_user(request: Request) -> dict:
    """
    Validates Supabase JWT and returns a user dict.

    Supabase JWTs use EdDSA (Ed25519) keys. Validation steps:
    1. Extract token from header or query param
    2. Fetch JWKS from Supabase (cached)
    3. Decode and verify JWT signature and expiry

    Returns dict with: id, email, tier
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        jwks_data = await _get_cached_jwks()

        # Build a dict of available keys by kid
        keys = {}
        for k in jwks_data.get("keys", []):
            kid = k.get("kid")
            if kid:
                keys[kid] = jwk.construct(k)

        # Decode header to find kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid or kid not in keys:
            # Try refreshing JWKS in case keys rotated
            global _jwks_cache, _jwks_cache_ts
            _jwks_cache = {}
            _jwks_cache_ts = 0
            jwks_data = await _get_cached_jwks()
            for k in jwks_data.get("keys", []):
                kid = k.get("kid")
                if kid:
                    keys[kid] = jwk.construct(k)
            kid = unverified_header.get("kid")

            if not kid or kid not in keys:
                raise HTTPException(401, "Invalid token: unknown key")

        key = keys[kid]

        payload = jwt.decode(
            token,
            key,
            algorithms=["EdDSA"],
            options={"verify_signature": True, "verify_exp": True}
        )

        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "tier": payload.get("user_metadata", {}).get("tier", "FREE"),
            "role": payload.get("role", "authenticated"),
        }

    except HTTPException:
        raise
    except JWTError as e:
        log.error("Supabase token validation failed", error=str(e))
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
