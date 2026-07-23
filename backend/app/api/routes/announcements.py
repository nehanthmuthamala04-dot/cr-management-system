from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from app.core.security import get_current_user, require_admin_or_cr
from app.db.mongodb import db
from app.dev_data import DEV_ANNOUNCEMENTS
from app.schemas.common import AnnouncementIn
from app.services.attendance import serialize_doc

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("")
async def list_announcements(user: dict = Depends(get_current_user)) -> list[dict]:
    try:
        items = await db.announcements.find().sort("createdAt", -1).to_list(length=50)
    except Exception:
        items = DEV_ANNOUNCEMENTS
    return [serialize_doc(item) for item in items]


@router.post("")
async def create_announcement(
    payload: AnnouncementIn,
    user: dict = Depends(require_admin_or_cr),
) -> dict:
    item = {
        **payload.model_dump(),
        "createdBy": user["_id"],
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    result = await db.announcements.insert_one(item)
    item["_id"] = result.inserted_id
    return serialize_doc(item)


@router.put("/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    payload: AnnouncementIn,
    user: dict = Depends(require_admin_or_cr),
) -> dict:
    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement id")
    result = await db.announcements.find_one_and_update(
        {"_id": ObjectId(announcement_id)},
        {"$set": {**payload.model_dump(), "updatedAt": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return serialize_doc(result)


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    user: dict = Depends(require_admin_or_cr),
) -> dict:
    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement id")
    result = await db.announcements.delete_one({"_id": ObjectId(announcement_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"deleted": True}
