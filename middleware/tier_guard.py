from fastapi import HTTPException, Depends
from db.models import User
from .auth import get_current_user
import structlog

log = structlog.get_logger()

def require_tier(min_tier: str):
    """
    Dependency to enforce minimum user tier.
    Tiers: FREE < PRO < ENTERPRISE
    """
    tier_levels = {"FREE": 0, "PRO": 1, "ENTERPRISE": 2}
    
    async def tier_checker(current_user: User = Depends(get_current_user)):
        user_level = tier_levels.get(current_user.tier, 0)
        required_level = tier_levels.get(min_tier, 0)
        
        if user_level < required_level:
            log.warning("Tier access denied", user_id=current_user.id, user_tier=current_user.tier, required_tier=min_tier)
            raise HTTPException(
                status_code=403, 
                detail=f"This feature requires a {min_tier} subscription."
            )
        return current_user
        
    return tier_checker

# Convenience dependencies
require_pro = require_tier("PRO")
require_enterprise = require_tier("ENTERPRISE")
