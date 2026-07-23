from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, require_admin_or_cr
from app.db.mongodb import db
from app.dev_data import DEV_ATTENDANCE, DEV_HOLIDAYS, DEV_STUDENTS, DEV_SUBJECTS
from app.schemas.common import AttendanceMarkIn, HolidayIn, SubjectIn
from app.services.attendance import login_attendance, logout_attendance, monthly_leaderboard, ranking, serialize_doc

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/subjects")
async def list_subjects(user: dict = Depends(get_current_user)) -> list[dict]:
    try:
        subjects = await db.subjects.find().sort("name", 1).to_list(length=None)
        if not subjects:
            subjects = DEV_SUBJECTS
    except Exception:
        subjects = DEV_SUBJECTS
    return [serialize_doc(item.copy()) for item in subjects]


@router.post("/subjects")
async def add_subject(payload: SubjectIn, user: dict = Depends(require_admin_or_cr)) -> dict:
    name = " ".join(payload.name.split()).strip()
    if any(item["name"].casefold() == name.casefold() for item in DEV_SUBJECTS):
        raise HTTPException(status_code=409, detail="Subject already exists")
    subject = {"_id": f"subject_{name.casefold().replace(' ', '_')}", "name": name}
    try:
        existing = await db.subjects.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
        if existing:
            raise HTTPException(status_code=409, detail="Subject already exists")
        await db.subjects.insert_one(subject)
    except HTTPException:
        raise
    except Exception:
        DEV_SUBJECTS.append(subject)
    return serialize_doc(subject.copy())


@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, user: dict = Depends(require_admin_or_cr)) -> dict:
    subject = next((item for item in DEV_SUBJECTS if item["_id"] == subject_id), None)
    try:
        subject = await db.subjects.find_one({"_id": subject_id}) or subject
    except Exception:
        pass
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if subject["name"] == "General":
        raise HTTPException(status_code=400, detail="General subject cannot be deleted")
    try:
        await db.subjects.delete_one({"_id": subject_id})
    except Exception:
        DEV_SUBJECTS[:] = [item for item in DEV_SUBJECTS if item["_id"] != subject_id]
    return {"deleted": True}


@router.post("/login")
async def login(user: dict = Depends(get_current_user)) -> dict:
    return await login_attendance(user)


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)) -> dict:
    return await logout_attendance(user)


@router.get("/me")
async def my_attendance(user: dict = Depends(get_current_user)) -> list[dict]:
    try:
        records = await db.attendance.find({"userId": user["_id"]}).sort("date", -1).to_list(length=200)
    except Exception:
        records = [item for item in DEV_ATTENDANCE if item["userId"] == user["_id"]]
    return [serialize_doc(item) for item in records]


@router.get("/ranking")
async def attendance_ranking(user: dict = Depends(get_current_user)) -> list[dict]:
    return await ranking()


@router.get("/leaderboard")
async def attendance_leaderboard(month: str | None = None, user: dict = Depends(get_current_user)) -> dict:
    return await monthly_leaderboard(month)


@router.get("/holidays")
async def list_holidays(user: dict = Depends(get_current_user)) -> list[dict]:
    return [
        {"date": holiday_date, "title": title}
        for holiday_date, title in sorted(DEV_HOLIDAYS.items())
    ]


@router.post("/holidays")
async def add_holiday(payload: HolidayIn, user: dict = Depends(require_admin_or_cr)) -> dict:
    try:
        date.fromisoformat(payload.date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid holiday date") from exc
    DEV_HOLIDAYS[payload.date] = payload.title
    return {"date": payload.date, "title": payload.title}


@router.delete("/holidays/{holiday_date}")
async def delete_holiday(holiday_date: str, user: dict = Depends(require_admin_or_cr)) -> dict:
    if holiday_date not in DEV_HOLIDAYS:
        raise HTTPException(status_code=404, detail="Holiday not found")
    del DEV_HOLIDAYS[holiday_date]
    return {"deleted": True}


@router.get("/daily")
async def daily_attendance(
    day: str | None = None,
    subject: str | None = None,
    user: dict = Depends(require_admin_or_cr),
) -> dict:
    record_date = day or date.today().isoformat()
    try:
        date.fromisoformat(record_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid attendance date") from exc
    if record_date > date.today().isoformat():
        raise HTTPException(status_code=400, detail="Attendance cannot be taken for a future date")
    record_subject = subject or "General"
    students = await ranking()
    try:
        records = await db.attendance.find({"date": record_date, "subject": record_subject}).to_list(length=None)
    except Exception:
        records = [
            item for item in DEV_ATTENDANCE
            if item["date"] == record_date
            and item.get("subject", "General") == record_subject
        ]

    records_by_user = {item["userId"]: serialize_doc(item.copy()) for item in records}
    rows = []
    for student in students:
        record = records_by_user.get(student["id"])
        rows.append(
            {
                **student,
                "dailyStatus": record["status"] if record else "Not Marked",
                "dailyRecord": record,
            }
        )

    present = sum(1 for item in rows if item["dailyStatus"] == "Present")
    absent = sum(1 for item in rows if item["dailyStatus"] == "Absent")
    late = sum(1 for item in rows if item["dailyStatus"] == "Late")
    return {
        "date": record_date,
        "subject": record_subject,
        "total": len(rows),
        "present": present,
        "absent": absent,
        "late": late,
        "notMarked": len(rows) - present - absent - late,
        "students": rows,
    }


@router.post("/mark")
async def mark_attendance(payload: AttendanceMarkIn, user: dict = Depends(require_admin_or_cr)) -> dict:
    record_date = payload.date or date.today().isoformat()
    record_subject = payload.subject or "General"
    try:
        date.fromisoformat(record_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid attendance date") from exc
    if record_date > date.today().isoformat():
        raise HTTPException(status_code=400, detail="Attendance cannot be taken for a future date")
    now = datetime.now(timezone.utc)
    record = {
        "userId": payload.userId,
        "date": record_date,
        "loginTime": now if payload.status in {"Present", "Late"} else None,
        "logoutTime": None,
        "duration": 0,
        "status": payload.status,
        "subject": record_subject,
        "approvalStatus": "Approved",
    }
    try:
        await db.attendance.update_one(
            {
                "userId": payload.userId,
                "date": record_date,
                "subject": record_subject,
            },
            {"$set": record},
            upsert=True,
        )
    except Exception:
        existing = next(
            (
                item for item in DEV_ATTENDANCE
                if item["userId"] == payload.userId
                and item["date"] == record_date
                and item.get("subject", "General") == record_subject
            ),
            None,
        )
        if existing:
            existing.update(record)
            record = existing
        else:
            record["_id"] = f"{payload.userId}_{record_date}_{record_subject.lower().replace(' ', '_')}"
            DEV_ATTENDANCE.insert(0, record)
        student = next((item for item in DEV_STUDENTS if item["id"] == payload.userId), None)
        if student:
            student_records = [item for item in DEV_ATTENDANCE if item["userId"] == payload.userId]
            present = sum(1 for item in student_records if item["status"] in {"Present", "Late"})
            absent = sum(1 for item in student_records if item["status"] == "Absent")
            total = present + absent
            student["totalDaysPresent"] = present
            student["totalDaysAbsent"] = absent
            student["attendancePercentage"] = round((present / total) * 100, 2) if total else 0
    return serialize_doc(record)


@router.get("/report")
async def class_attendance_report(month: str | None = None, user: dict = Depends(require_admin_or_cr)) -> dict:
    leaderboard = await monthly_leaderboard(month)
    target_month = leaderboard["month"]
    try:
        records = await db.attendance.find({"date": {"$regex": f"^{target_month}"}}).to_list(length=None)
    except Exception:
        records = [item for item in DEV_ATTENDANCE if item.get("date", "").startswith(target_month)]

    subject_summary: dict[str, dict] = {}
    for record in records:
        subject = record.get("subject") or "General"
        summary = subject_summary.setdefault(
            subject,
            {"subject": subject, "present": 0, "absent": 0, "late": 0, "total": 0},
        )
        status = record.get("status")
        if status == "Late":
            summary["late"] += 1
            summary["present"] += 1
        elif status == "Present":
            summary["present"] += 1
        elif status == "Absent":
            summary["absent"] += 1
        summary["total"] += 1

    students = leaderboard["students"]
    low_students = [student for student in students if student.get("monthlyPercentage", 0) < 75]
    class_percentage = round(
        sum(student.get("monthlyPercentage", 0) for student in students) / len(students),
        2,
    ) if students else 0
    return {
        **leaderboard,
        "classPercentage": class_percentage,
        "lowAttendanceStudents": low_students,
        "subjectSummary": list(subject_summary.values()),
    }
