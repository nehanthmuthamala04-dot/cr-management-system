from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.mongodb import db
from app.dev_data import DEV_GROUP, DEV_STUDENTS
from app.services.attendance import active_student_users, serialize_doc

router = APIRouter(prefix="/groups", tags=["Groups"])


class GroupUpdate(BaseModel):
    groupName: str
    department: str
    year: str
    semester: str
    section: str
    academicYear: str
    crName: str
    facultyCoordinator: str
    joinCode: str


@router.get("/class")
async def class_group(user: dict = Depends(get_current_user)) -> dict:
    try:
        count = await db.users.count_documents({})
        group = await db.groups.find_one({})
        if group:
            group["totalStudents"] = count
            return serialize_doc(group)
    except Exception:
        # Development mode - MongoDB not available
        pass
    
    active_count = len(active_student_users(DEV_STUDENTS))

    DEV_GROUP["totalStudents"] = active_count
    return DEV_GROUP


@router.put("/class")
async def update_class_group(payload: GroupUpdate, user: dict = Depends(get_current_user)) -> dict:
    group_data = payload.model_dump()
    group_data["branch"] = group_data["department"]
    group_data["updatedAt"] = datetime.now(timezone.utc)

    try:
        await db.groups.update_one(
            {},
            {"$set": group_data, "$setOnInsert": {"createdAt": datetime.now(timezone.utc)}},
            upsert=True,
        )
        count = await db.users.count_documents({})
        saved = await db.groups.find_one({"groupName": group_data["groupName"]}) or group_data
        saved["totalStudents"] = count
        return serialize_doc(saved)
    except Exception:
        active_count = len(active_student_users(DEV_STUDENTS))
        DEV_GROUP.update(group_data)
        DEV_GROUP["totalStudents"] = active_count
        return DEV_GROUP
