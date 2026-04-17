from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import User
from middleware.auth import get_current_user
import secrets

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(supabase_user: dict = Depends(get_current_user)):
    """
    Returns the current user profile including linking status.
    Note: Telegram/WhatsApp linking requires DB lookup by email.
    """
    # For linking status, we need to look up in PostgreSQL by email
    # The supabase_user dict contains email from the JWT
    return {
        "email": supabase_user["email"],
        "tier": supabase_user.get("tier", "FREE"),
        "id": supabase_user["id"],
    }


@router.post("/telegram/generate-link")
def generate_telegram_link(
    db: Session = Depends(get_db),
    supabase_user: dict = Depends(get_current_user)
):
    """
    Generates a unique code for the user to link their Telegram account.
    Looks up or creates User record by email in PostgreSQL.
    """
    email = supabase_user["email"]

    # Find or create user by email for telegram linking
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create placeholder user linked to Supabase user
        from db.models import User as UserModel
        user = UserModel(
            email=email,
            hashed_password="",  # No password - Supabase handles auth
            full_name=supabase_user.get("full_name", ""),
            tier=supabase_user.get("tier", "FREE"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.telegram_linking_code:
        user.telegram_linking_code = secrets.token_hex(8)
        db.commit()

    bot_username = "StockSenseAIBot"
    link = f"https://t.me/{bot_username}?start={user.telegram_linking_code}"

    return {"link": link, "code": user.telegram_linking_code}
