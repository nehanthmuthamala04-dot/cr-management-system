from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.dev_data import DEV_SUBJECTS


class UnavailableCollection:
    def __init__(self, error: Exception):
        self.error = error

    def find(self, *args, **kwargs):
        return UnavailableCursor(self.error)

    def __getattr__(self, name: str):
        async def unavailable(*args, **kwargs):
            raise RuntimeError(f"MongoDB is unavailable: {self.error}") from self.error

        return unavailable


class UnavailableCursor:
    def __init__(self, error: Exception):
        self.error = error

    def sort(self, *args, **kwargs):
        return self

    async def to_list(self, *args, **kwargs):
        raise RuntimeError(f"MongoDB is unavailable: {self.error}") from self.error


class UnavailableDatabase:
    def __init__(self, error: Exception):
        self.error = error

    def __getattr__(self, name: str) -> UnavailableCollection:
        return UnavailableCollection(self.error)


if settings.use_mock_db or settings.mongodb_uri.startswith("mongodb+srv://"):
    reason = "USE_MOCK_DB is enabled" if settings.use_mock_db else "MongoDB SRV lookup skipped in local dev"
    client = None
    db = UnavailableDatabase(RuntimeError(reason))
else:
    client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=1000)
    db = client[settings.database_name]


async def ensure_indexes() -> None:
    await db.users.create_index("googleId", unique=True, sparse=True)
    await db.users.create_index("email", unique=True, sparse=True)
    await db.users.create_index("rollNumber", unique=True, sparse=True)
    # Attendance is unique per student, date and subject.
    for index in await db.attendance.list_indexes().to_list(length=None):
        keys = list(index.get("key", {}).keys())
        if index.get("unique") and keys in (["userId", "date"], ["userId", "date", "subject", "period"]):
            await db.attendance.drop_index(index["name"])
    await db.attendance.create_index(
        [("userId", 1), ("date", 1), ("subject", 1)],
        unique=True,
        name="user_date_subject_unique",
    )
    await db.subjects.create_index("name", unique=True)
    for subject in DEV_SUBJECTS:
        await db.subjects.update_one(
            {"_id": subject["_id"]},
            {"$setOnInsert": subject},
            upsert=True,
        )
    await db.announcements.create_index("createdAt")
