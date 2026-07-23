from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, require_admin_or_cr
from app.db.mongodb import db
from app.dev_data import DELETED_STUDENT_IDS, DEV_ATTENDANCE, DEV_STUDENTS
from app.schemas.common import StudentIn
from app.services.attendance import active_student_users, ranking

router = APIRouter(prefix="/students", tags=["Students"])


def student_id_from_roll(roll_number: str) -> str:
    return "roll_" + "".join(char.lower() if char.isalnum() else "_" for char in roll_number.strip())


def student_fields(payload: StudentIn) -> dict:
    return {
        "name": payload.name.strip(),
        "rollNumber": payload.rollNumber.strip(),
        "email": (payload.email or "").strip(),
        "phone": (payload.phone or "").strip(),
        "department": (payload.department or "").strip(),
        "year": (payload.year or "").strip(),
        "semester": (payload.semester or "").strip(),
        "section": (payload.section or "").strip(),
    }


@router.get("")
async def students(user: dict = Depends(get_current_user)) -> list[dict]:
    return await ranking()


@router.post("")
async def add_student(payload: StudentIn, user: dict = Depends(require_admin_or_cr)) -> dict:
    student_id = student_id_from_roll(payload.rollNumber)
    student = {
        "id": student_id,
        "_id": student_id,
        **student_fields(payload),
        "photo": None,
        "role": "student",
        "attendancePercentage": 0,
        "totalDaysPresent": 0,
        "totalDaysAbsent": 0,
    }
    try:
        existing = await db.users.find_one(
            {
                "$or": [
                    {"rollNumber": payload.rollNumber.strip()},
                    {"name": payload.name.strip()},
                ],
                "role": "student",
            }
        )
        if existing:
            raise HTTPException(status_code=409, detail="Student already exists")
        await db.users.insert_one(student)
        return student
    except HTTPException:
        raise
    except Exception:
        active_students = active_student_users(DEV_STUDENTS)
        duplicate_roll = any(item.get("rollNumber", "").strip().lower() == payload.rollNumber.strip().lower() for item in active_students)
        duplicate_name = any(item["name"].strip().lower() == payload.name.strip().lower() for item in active_students)
        if duplicate_roll or duplicate_name:
            raise HTTPException(status_code=409, detail="Student already exists")
        existing = next((item for item in DEV_STUDENTS if item.get("rollNumber", "").strip().lower() == payload.rollNumber.strip().lower()), None)
        if existing:
            existing.update(student)
            DELETED_STUDENT_IDS.discard(existing["id"])
        else:
            DEV_STUDENTS.append(student)
        return student


@router.put("/{student_id}")
async def update_student(
    student_id: str,
    payload: StudentIn,
    user: dict = Depends(require_admin_or_cr),
) -> dict:
    new_student_id = student_id_from_roll(payload.rollNumber)
    updates = {
        "id": new_student_id,
        "_id": new_student_id,
        **student_fields(payload),
        "role": "student",
    }
    try:
        duplicate = await db.users.find_one(
            {
                "_id": {"$ne": student_id},
                "$or": [
                    {"rollNumber": payload.rollNumber.strip()},
                    {"name": payload.name.strip()},
                ],
                "role": "student",
            }
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="Student already exists")
        if new_student_id != student_id:
            existing = await db.users.find_one({"_id": student_id})
            if not existing:
                raise HTTPException(status_code=404, detail="Student not found")
            await db.users.delete_one({"_id": student_id})
            existing.update(updates)
            await db.users.insert_one(existing)
            await db.attendance.update_many({"userId": student_id}, {"$set": {"userId": new_student_id}})
            return existing
        result = await db.users.update_one({"_id": student_id}, {"$set": updates})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        updated = await db.users.find_one({"_id": new_student_id})
        return updated
    except HTTPException:
        raise
    except Exception:
        student = next((item for item in DEV_STUDENTS if item["id"] == student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        active_students = [item for item in active_student_users(DEV_STUDENTS) if item["id"] != student_id]
        duplicate_roll = any(item.get("rollNumber", "").strip().lower() == payload.rollNumber.strip().lower() for item in active_students)
        duplicate_name = any(item["name"].strip().lower() == payload.name.strip().lower() for item in active_students)
        if duplicate_roll or duplicate_name:
            raise HTTPException(status_code=409, detail="Student already exists")
        student.update(updates)
        for record in DEV_ATTENDANCE:
            if record["userId"] == student_id:
                record["userId"] = new_student_id
                record["_id"] = f"{new_student_id}_{record['date']}"
        return student


@router.delete("/{student_id}")
async def delete_student(student_id: str, user: dict = Depends(require_admin_or_cr)) -> dict:
    try:
        result = await db.users.delete_one({"_id": student_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception:
        if not any(item["id"] == student_id for item in DEV_STUDENTS) or student_id in DELETED_STUDENT_IDS:
            raise HTTPException(status_code=404, detail="Student not found")
        DEV_STUDENTS[:] = [item for item in DEV_STUDENTS if item["id"] != student_id]
        DELETED_STUDENT_IDS.discard(student_id)
        DEV_ATTENDANCE[:] = [item for item in DEV_ATTENDANCE if item["userId"] != student_id]
        return {"deleted": True}


@router.get("/count")
async def student_count(user: dict = Depends(get_current_user)) -> dict:
    try:
        count = await db.users.count_documents({})
        await db.groups.update_one(
            {"groupName": "DS 3-1 Semester Group"},
            {"$set": {"totalStudents": count}},
        )
    except Exception:
        count = len(active_student_users(DEV_STUDENTS))
    return {"totalStudents": count}
