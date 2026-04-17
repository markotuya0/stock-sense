from fastapi import HTTPException, Depends
from .auth import get_current_user
import structlog

log = structlog.get_logger()

def require_tier(min_tier: str):
    """
    Dependency to enforce minimum user tier.
    Tiers: FREE < PRO < ENTERPRISE

    Updated to work with dict-based user from Supabase JWT
    instead of SQLAlchemy User model.
    """
    tier_levels = {"FREE": 0, "PRO": 1, "ENTERPRISE": 2}

    async def tier_checker(supabase_user: dict = Depends(get_current_user)):
        user_tier = supabase_user.get("tier", "FREE")
        user_level = tier_levels.get(user_tier, 0)
        required_level = tier_levels.get(min_tier, 0)

        if user_level < required_level:
            log.warning(
                "Tier access denied",
                user_id=supabase_user.get("id"),
                user_tier=user_tier,
                required_tier=min_tier
            )
            raise HTTPException(
                status_code=403,
                detail=f"This feature requires a {min_tier} subscription."
            )
        return supabase_user

    return tier_checker

require_pro = require_tier("PRO")
require_enterprise = require_tier("ENTERPRISE")
