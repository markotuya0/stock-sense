from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from db.session import get_db
from db.models import User
from services.auth_service import ALGORITHM, decode_token
from config import settings
import structlog
from typing import Optional

log = structlog.get_logger()

def _extract_access_token(request: Request) -> Optional[str]:
    # Typical HTTP auth path
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]

    # SSE-friendly path (EventSource cannot set Authorization headers)
    return request.query_params.get("token") or request.query_params.get("access_token")


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = _extract_access_token(request)
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    email: str = payload.get("sub")
    token_type: str = payload.get("type")
    
    if email is None or token_type != "access":
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user
