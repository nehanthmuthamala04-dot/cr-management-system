from pydantic import BaseModel, Field


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=20)


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: dict


class AnnouncementIn(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    message: str = Field(min_length=2, max_length=500)


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    photo: str | None = None


class StudentIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    rollNumber: str = Field(min_length=1, max_length=40)
    email: str | None = Field(default="", max_length=120)
    phone: str | None = Field(default="", max_length=30)
    department: str | None = Field(default="", max_length=80)
    year: str | None = Field(default="", max_length=40)
    semester: str | None = Field(default="", max_length=20)
    section: str | None = Field(default="", max_length=20)


class AttendanceMarkIn(BaseModel):
    userId: str = Field(min_length=2)
    status: str = Field(pattern="^(Present|Absent|Late)$")
    date: str | None = None
    subject: str | None = Field(default="General", max_length=80)


class HolidayIn(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    title: str = Field(default="Holiday", min_length=2, max_length=80)


class SubjectIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
