import calendar
from datetime import date, datetime, timezone

from fastapi import HTTPException

from app.db.mongodb import db
from app.dev_data import DELETED_STUDENT_IDS, DEV_ATTENDANCE, DEV_HOLIDAYS, DEV_STUDENTS, WEEKLY_HOLIDAY_DAYS


def serialize_doc(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


def duration_minutes(start: datetime, end: datetime) -> int:
    return max(0, int((end - start).total_seconds() // 60))


async def attendance_summary(user_id: str) -> dict:
    try:
        records = await db.attendance.find({"userId": user_id}).to_list(length=None)
    except Exception:
        records = [item for item in DEV_ATTENDANCE if item["userId"] == user_id]
    present = sum(1 for item in records if item.get("status") in {"Present", "Late"})
    total = len(records)
    absent = sum(1 for item in records if item.get("status") == "Absent")
    percentage = round((present / total) * 100, 2) if total else 0
    return {
        "attendancePercentage": percentage,
        "totalDaysPresent": present,
        "totalDaysAbsent": absent,
    }


def current_month() -> str:
    return date.today().strftime("%Y-%m")


def working_days_for_month(month: str) -> tuple[int, int]:
    year, month_number = [int(part) for part in month.split("-")]
    today = date.today()
    last_day = calendar.monthrange(year, month_number)[1]
    end_day = today.day if today.year == year and today.month == month_number else last_day
    working_days = 0
    holidays = 0
    for day in range(1, end_day + 1):
        current = date(year, month_number, day)
        is_holiday = current.weekday() in WEEKLY_HOLIDAY_DAYS or current.isoformat() in DEV_HOLIDAYS
        if is_holiday:
            holidays += 1
        else:
            working_days += 1
    return working_days, holidays


def active_student_users(users: list[dict]) -> list[dict]:
    return [
        item for item in users
        if (item.get("id") or item.get("_id")) not in DELETED_STUDENT_IDS
        and item.get("role", "student") == "student"
    ]


def monthly_summary_from_records(records: list[dict], month: str) -> dict:
    month_records = [item for item in records if item.get("date", "").startswith(month)]
    present = sum(1 for item in month_records if item.get("status") in {"Present", "Late"})
    absent = sum(1 for item in month_records if item.get("status") == "Absent")
    late = sum(1 for item in month_records if item.get("status") == "Late")
    working_days, holidays = working_days_for_month(month)
    not_marked = max(0, working_days - present - absent)
    percentage = round((present / working_days) * 100, 2) if working_days else 0
    return {
        "month": month,
        "monthlyPercentage": percentage,
        "monthlyPresent": present,
        "monthlyAbsent": absent,
        "monthlyLate": late,
        "monthlyMarked": present + absent,
        "monthlyWorkingDays": working_days,
        "monthlyHolidays": holidays,
        "monthlyNotMarked": not_marked,
    }


async def monthly_attendance_summary(user_id: str, month: str | None = None) -> dict:
    target_month = month or current_month()
    try:
        records = await db.attendance.find({"userId": user_id}).to_list(length=None)
    except Exception:
        records = [item for item in DEV_ATTENDANCE if item["userId"] == user_id]
    return monthly_summary_from_records(records, target_month)


async def login_attendance(user: dict) -> dict:
    today = date.today().isoformat()
    now = datetime.now(timezone.utc)
    record = {
        "userId": user["_id"],
        "date": today,
        "loginTime": now,
        "logoutTime": None,
        "duration": 0,
        "status": "Present",
        "subject": "General",
    }
    try:
        result = await db.attendance.insert_one(record)
        record["_id"] = result.inserted_id
        return serialize_doc(record)
    except Exception as exc:
        existing = next(
            (
                item for item in DEV_ATTENDANCE
                if item["userId"] == user["_id"]
                and item["date"] == today
                and item.get("subject", "General") == "General"
            ),
            None,
        )
        if existing:
            return existing
        record["_id"] = f"attendance_{today}"
        DEV_ATTENDANCE.insert(0, record)
        return serialize_doc(record)


async def logout_attendance(user: dict) -> dict:
    today = date.today().isoformat()
    try:
        record = await db.attendance.find_one(
            {"userId": user["_id"], "date": today, "subject": "General"}
        )
    except Exception:
        record = next(
            (
                item for item in DEV_ATTENDANCE
                if item["userId"] == user["_id"]
                and item["date"] == today
                and item.get("subject", "General") == "General"
            ),
            None,
        )
    if not record:
        raise HTTPException(status_code=404, detail="Login attendance first")
    if record.get("logoutTime"):
        raise HTTPException(status_code=409, detail="Attendance already logged out today")

    now = datetime.now(timezone.utc)
    duration = duration_minutes(record["loginTime"], now)
    try:
        await db.attendance.update_one(
            {"_id": record["_id"]},
            {"$set": {"logoutTime": now, "duration": duration}},
        )
    except Exception:
        pass
    record["logoutTime"] = now
    record["duration"] = duration
    return serialize_doc(record)


async def ranking() -> list[dict]:
    try:
        users = await db.users.find().to_list(length=None)
    except Exception:
        return active_student_users(DEV_STUDENTS)
    users = active_student_users(users)
    rows = []
    for user in users:
        summary = await attendance_summary(user["_id"])
        rows.append(
            {
                "id": user["_id"],
                "name": user["name"],
                "rollNumber": user.get("rollNumber", ""),
                "email": user.get("email", ""),
                "phone": user.get("phone", ""),
                "department": user.get("department", ""),
                "year": user.get("year", ""),
                "semester": user.get("semester", ""),
                "section": user.get("section", ""),
                "photo": user.get("photo"),
                **summary,
            }
        )
    return sorted(rows, key=lambda row: (-row["attendancePercentage"], row["name"].lower()))


async def monthly_leaderboard(month: str | None = None) -> dict:
    target_month = month or current_month()
    working_days, holidays = working_days_for_month(target_month)
    try:
        users = await db.users.find().to_list(length=None)
        records = await db.attendance.find({"date": {"$regex": f"^{target_month}"}}).to_list(length=None)
    except Exception:
        users = active_student_users(DEV_STUDENTS)
        records = [item for item in DEV_ATTENDANCE if item.get("date", "").startswith(target_month)]
    users = active_student_users(users)

    rows = []
    for user in users:
        user_id = user.get("id") or user.get("_id")
        summary = monthly_summary_from_records(
            [item for item in records if item["userId"] == user_id],
            target_month,
        )
        rows.append(
            {
                "id": user_id,
                "name": user["name"],
                "rollNumber": user.get("rollNumber", ""),
                "email": user.get("email", ""),
                "phone": user.get("phone", ""),
                "department": user.get("department", ""),
                "year": user.get("year", ""),
                "semester": user.get("semester", ""),
                "section": user.get("section", ""),
                "photo": user.get("photo"),
                **summary,
            }
        )

    rows = sorted(rows, key=lambda row: (-row["monthlyPercentage"], -row["monthlyPresent"], row["name"].lower()))
    for index, row in enumerate(rows, start=1):
        row["rank"] = index
    return {
        "month": target_month,
        "workingDays": working_days,
        "holidays": holidays,
        "students": rows,
    }
