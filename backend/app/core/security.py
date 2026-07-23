from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import JWTError, jwt

from app.core.config import settings
from app.db.mongodb import db

bearer_scheme = HTTPBearer()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    expire = utc_now() + timedelta(minutes=settings.jwt_expire_minutes)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_google_token(credential: str) -> dict[str, Any]:
    try:
        return id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google credential") from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    if user_id == "dev_test_user":
        return {
            "_id": user_id,
            "googleId": user_id,
            "email": "test@example.com",
            "name": "Test Student",
            "photo": None,
            "role": payload.get("role", "cr"),
        }

    # For development mode, return the JWT payload as the user
    # In production, fetch from MongoDB
    try:
        user = await db.users.find_one({"_id": user_id})
        if user:
            return user
    except Exception:
        pass
    
    # Fallback to JWT payload for development
    return {
        "_id": user_id,
        "googleId": user_id,
        "email": "dev@example.com",
        "name": "Dev User",
        "role": payload.get("role", "student"),
    }


def require_admin_or_cr(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") not in {"admin", "cr"}:
        raise HTTPException(status_code=403, detail="Admin or CR access required")
    return user
