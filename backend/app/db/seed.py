from datetime import datetime, timezone

from app.db.mongodb import db


async def seed_group() -> None:
    existing = await db.groups.find_one({"groupName": "DS 3-1 Semester Group"})
    if existing:
        return
    await db.groups.insert_one(
        {
            "groupName": "DS 3-1 Semester Group",
            "academicYear": "2026-2027",
            "department": "Data Science",
            "year": "3rd Year",
            "semester": "3-1",
            "branch": "Data Science",
            "section": "A",
            "crName": "Class Representative",
            "facultyCoordinator": "Faculty Coordinator",
            "joinCode": "DS31-CR",
            "totalStudents": 0,
            "createdAt": datetime.now(timezone.utc),
        }
    )
