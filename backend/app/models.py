import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRole = Field(default=UserRole.DOCTOR)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    doctor: Optional["Doctor"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Doctor model
class DoctorBase(SQLModel):
    full_name: str = Field(max_length=255)
    specialty: str | None = Field(default=None, max_length=255)
    experience_years: int | None = Field(default=None, ge=0)
    bio: str | None = Field(default=None, max_length=2000)
    photo_url: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    consultation_duration: int | None = Field(default=None, ge=5, le=180)
    is_active: bool = True


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(DoctorBase):
    full_name: str | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    specialty: str | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    is_active: bool | None = None  # type: ignore[assignment]
    phone: str | None = Field(default=None, max_length=50)  # type: ignore[assignment]
    consultation_duration: int | None = Field(default=None, ge=5, le=180)  # type: ignore[assignment]


class Doctor(DoctorBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, unique=True, ondelete="CASCADE"
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        sa_column_kwargs={"onupdate": get_datetime_utc},
    )
    user: Optional["User"] = Relationship(back_populates="doctor")


class DoctorPublic(DoctorBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DoctorsPublic(SQLModel):
    data: list[DoctorPublic]
    count: int


class DoctorCreateWithUser(SQLModel):
    """Schema for creating a doctor with automatic user creation.
    
    This is the business-oriented input schema that combines
    user credentials with doctor profile information.
    The specialization field maps to the internal specialty column.
    """
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    bio: str | None = Field(default=None, max_length=2000)
    experience_years: int | None = Field(default=None, ge=0)
    consultation_duration: int | None = Field(default=None, ge=5, le=180)
    is_active: bool = True


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
