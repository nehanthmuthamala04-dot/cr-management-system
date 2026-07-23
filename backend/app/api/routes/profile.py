from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.mongodb import db
from app.schemas.common import ProfileUpdate
from app.services.attendance import attendance_summary, monthly_attendance_summary

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("")
async def get_profile(user: dict = Depends(get_current_user)) -> dict:
    return {**user, **await attendance_summary(user["_id"]), **await monthly_attendance_summary(user["_id"])}


@router.put("")
async def update_profile(
    payload: ProfileUpdate,
    user: dict = Depends(get_current_user),
) -> dict:
    updates = {key: value for key, value in payload.model_dump().items() if value is not None}
    try:
        if updates:
            await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
        updated = await db.users.find_one({"_id": user["_id"]})
    except Exception:
        updated = {**user, **updates}
    return {**updated, **await attendance_summary(user["_id"]), **await monthly_attendance_summary(user["_id"])}
