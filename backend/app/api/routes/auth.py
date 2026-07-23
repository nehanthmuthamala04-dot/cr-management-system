from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.security import create_access_token, get_current_user, verify_google_token
from app.db.mongodb import db
from app.schemas.common import GoogleLoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/google", response_model=TokenResponse)
async def google_login(payload: GoogleLoginRequest) -> TokenResponse:
    google_user = verify_google_token(payload.credential)
    google_id = google_user["sub"]
    now = datetime.now(timezone.utc)
    update = {
        "$set": {
            "googleId": google_id,
            "name": google_user.get("name", ""),
            "email": google_user.get("email", ""),
            "photo": google_user.get("picture"),
            "lastLoginTime": now,
            "updatedAt": now,
        },
        "$setOnInsert": {
            "_id": google_id,
            "role": "student",
            "firstLoginDate": now,
            "createdAt": now,
        },
    }
    await db.users.update_one({"_id": google_id}, update, upsert=True)
    user = await db.users.find_one({"_id": google_id})
    access_token = create_access_token(google_id, {"role": user["role"]})
    return TokenResponse(accessToken=access_token, user=user)


@router.get("/me")
async def current_user(user: dict = Depends(get_current_user)) -> dict:
    """Get current user - returns the user from JWT token"""
    # For development, return a mock user object with the authenticated user's ID
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "_id": user.get("sub", "dev_test_user"),
        "googleId": user.get("sub", "dev_test_user"),
        "name": "Test Student",
        "email": "test@example.com",
        "photo": None,
        "role": user.get("role", "student"),
        "lastLoginTime": now_iso,
        "updatedAt": now_iso,
        "firstLoginDate": now_iso,
        "createdAt": now_iso,
    }


@router.get("/verify")
async def verify_jwt(user: dict = Depends(get_current_user)) -> dict:
    return {"valid": True, "user": user}


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login() -> TokenResponse:
    """Development login - creates a test user without Google OAuth or MongoDB"""
    google_id = "dev_test_user"
    now = datetime.now(timezone.utc)
    
    # Create a mock user object
    user = {
        "_id": google_id,
        "googleId": google_id,
        "name": "Test Student",
        "email": "test@example.com",
        "photo": None,
        "role": "cr",
        "lastLoginTime": now,
        "updatedAt": now,
        "firstLoginDate": now,
        "createdAt": now,
    }
    
    access_token = create_access_token(google_id, {"role": user["role"]})
    return TokenResponse(accessToken=access_token, user=user)
