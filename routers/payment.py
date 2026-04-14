from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from db.session import get_db
from db.models import User, Payment
from services.payment_service import payment_service
from middleware.auth import get_current_user
import uuid

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/initialize")
async def initialize_payment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Initialize a PRO tier subscription payment (12,999 NGN)."""
    amount_kobo = 1299900 
    
    try:
        res = await payment_service.initialize_transaction(
            email=current_user.email,
            amount=amount_kobo,
            metadata={"user_id": str(current_user.id), "tier": "PRO"}
        )
        
        if res.get("status"):
            data = res.get("data")
            # Log pending payment in DB
            new_payment = Payment(
                user_id=current_user.id,
                paystack_ref=data.get("reference"),
                amount=amount_kobo,
                tier_selected="PRO",
                status="PENDING"
            )
            db.add(new_payment)
            db.commit()
            return data
        
        raise HTTPException(status_code=400, detail="Could not initialize payment")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify/{reference}")
async def verify_payment(
    reference: str,
    db: Session = Depends(get_db)
) -> Any:
    """Verify payment and upgrade user tier."""
    try:
        verification = await payment_service.verify_transaction(reference)
        
        if verification.get("status") and verification.get("data").get("status") == "success":
            # Update payment record
            payment_record = db.query(Payment).filter(Payment.paystack_ref == reference).first()
            if payment_record:
                payment_record.status = "SUCCESS"
                
                # Upgrade user
                user = db.query(User).filter(User.id == payment_record.user_id).first()
                if user:
                    user.tier = "PRO"
                
                db.commit()
                return {"message": "Subscription activated", "tier": "PRO"}
        
        raise HTTPException(status_code=400, detail="Payment verification failed or incomplete")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
