from datetime import date, datetime, timedelta, timezone

DEV_STUDENTS = [
    {"id": "dev_test_user", "name": "Test CR", "email": "test@example.com", "photo": None, "role": "cr", "attendancePercentage": 0, "totalDaysPresent": 0, "totalDaysAbsent": 0},
]

DELETED_STUDENT_IDS = set()

# Extra holidays by date. Weekly holidays are excluded automatically.
DEV_HOLIDAYS = {}

DEV_SUBJECTS = [
    {"_id": "subject_general", "name": "General"},
    {"_id": "subject_dbms", "name": "DBMS"},
    {"_id": "subject_operating_systems", "name": "Operating Systems"},
    {"_id": "subject_data_science", "name": "Data Science"},
    {"_id": "subject_python", "name": "Python"},
    {"_id": "subject_java", "name": "Java"},
    {"_id": "subject_maths", "name": "Maths"},
]

# Python weekday numbers: Monday=0 ... Saturday=5, Sunday=6.
WEEKLY_HOLIDAY_DAYS = {5, 6}

DEV_GROUP = {
    "_id": "ds_3_1",
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
}

DEV_ANNOUNCEMENTS = [
    {
        "_id": "announcement_1",
        "title": "Project Review",
        "message": "Bring your mini project progress notes for tomorrow's review.",
        "createdAt": datetime.now(timezone.utc) - timedelta(hours=3),
    },
    {
        "_id": "announcement_2",
        "title": "Attendance Reminder",
        "message": "Mark login attendance before the first session starts.",
        "createdAt": datetime.now(timezone.utc) - timedelta(days=1),
    },
]

DEV_ATTENDANCE = [
]
