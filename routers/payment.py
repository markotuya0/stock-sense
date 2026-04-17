from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from db.session import get_db
from db.models import User, Payment
from middleware.auth import get_current_user
import uuid
import structlog

log = structlog.get_logger()

router = APIRouter(prefix="/payments", tags=["payments"])


def _get_or_create_user(db: Session, supabase_user: dict) -> User:
    """Get existing user by email or create new one from Supabase user."""
    email = supabase_user["email"]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        from uuid import UUID
        user = User(
            id=UUID(supabase_user["id"]),
            email=email,
            hashed_password="",
            full_name=supabase_user.get("full_name", ""),
            tier=supabase_user.get("tier", "FREE"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


async def _update_supabase_user_tier(email: str, tier: str) -> None:
    """Update tier in Supabase user metadata via service role key."""
    from supabase import create_client
    from config import settings

    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        # Find user by email
        user_resp = await supabase.auth.admin.list_users()
        sb_user = next((u for u in user_resp.users if u.email == email), None)
        if sb_user:
            await supabase.auth.admin.update_user_by_id(sb_user.id, {
                "user_metadata": {"tier": tier}
            })
            log.info("Supabase user tier updated", email=email, tier=tier)
    except Exception as e:
        log.error("Failed to update Supabase user tier", email=email, error=str(e))


@router.post("/initialize")
async def initialize_payment(
    supabase_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Initialize a PRO tier subscription payment (12,999 NGN)."""
    from services.payment_service import payment_service

    amount_kobo = 1299900

    try:
        user = _get_or_create_user(db, supabase_user)
        res = await payment_service.initialize_transaction(
            email=user.email,
            amount=amount_kobo,
            metadata={"user_id": str(user.id), "tier": "PRO"}
        )

        if res.get("status"):
            data = res.get("data")
            # Log pending payment in DB
            new_payment = Payment(
                user_id=user.id,
                paystack_ref=data.get("reference"),
                amount=amount_kobo,
                tier_selected="PRO",
                status="PENDING"
            )
            db.add(new_payment)
            db.commit()
            return data

        raise HTTPException(status_code=400, detail="Could not initialize payment")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verify/{reference}")
async def verify_payment(
    reference: str,
    db: Session = Depends(get_db),
    _supabase_user: dict = Depends(get_current_user)  # validate token but don't need user data
) -> Any:
    """Verify payment and upgrade user tier."""
    from services.payment_service import payment_service

    try:
        verification = await payment_service.verify_transaction(reference)

        if verification.get("status") and verification.get("data").get("status") == "success":
            # Update payment record
            payment_record = db.query(Payment).filter(Payment.paystack_ref == reference).first()
            if payment_record:
                payment_record.status = "SUCCESS"

                # Upgrade user in PostgreSQL
                user = db.query(User).filter(User.id == payment_record.user_id).first()
                if user:
                    user.tier = "PRO"
                    db.commit()

                # Sync tier to Supabase
                if user:
                    await _update_supabase_user_tier(user.email, "PRO")

                return {"message": "Subscription activated", "tier": "PRO"}

        raise HTTPException(status_code=400, detail="Payment verification failed or incomplete")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
