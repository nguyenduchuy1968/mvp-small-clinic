import enum
import uuid
from datetime import date, datetime, timezone
from typing import Optional

import sqlalchemy as sa
from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class ContactMethod(str, enum.Enum):
    PHONE = "phone"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    VIBER = "viber"
    ZALO = "zalo"
    TELEGRAM = "telegram"


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
    patient: Optional["Patient"] = Relationship(
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
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)


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
    availability: list["DoctorAvailability"] = Relationship(
        back_populates="doctor",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    appointments: list["Appointment"] = Relationship(
        back_populates="doctor",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    blocked_dates: list["BlockedDate"] = Relationship(
        back_populates="doctor",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Weekday(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class DoctorAvailabilityBase(SQLModel):
    weekday: Weekday = Field(
        sa_type=sa.Enum(
            Weekday,
            values_callable=lambda enum_type: [e.value for e in enum_type],
        ),
    )
    start_time: str = Field(max_length=5, regex=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(max_length=5, regex=r"^([01]\d|2[0-3]):[0-5]\d$")
    duration_minutes: int = Field(default=30, ge=5, le=480)
    is_active: bool = True


class DoctorAvailabilityCreate(DoctorAvailabilityBase):
    pass


class DoctorAvailabilityUpdate(DoctorAvailabilityBase):
    weekday: Weekday | None = None  # type: ignore[assignment]
    start_time: str | None = Field(default=None, max_length=5, regex=r"^([01]\d|2[0-3]):[0-5]\d$")  # type: ignore[assignment]
    end_time: str | None = Field(default=None, max_length=5, regex=r"^([01]\d|2[0-3]):[0-5]\d$")  # type: ignore[assignment]
    duration_minutes: int | None = Field(default=None, ge=5, le=480)  # type: ignore[assignment]
    is_active: bool | None = None  # type: ignore[assignment]


class DoctorAvailability(DoctorAvailabilityBase, table=True):
    __tablename__ = "doctor_availability"  # type: ignore[assignment]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doctor_id: uuid.UUID = Field(
        foreign_key="doctor.id",
        nullable=False,
        ondelete="CASCADE",
        index=True,
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
    doctor: Optional["Doctor"] = Relationship(back_populates="availability")

    __table_args__ = (
        # Prevent duplicate intervals for the same doctor on the same weekday
        sa.UniqueConstraint(
            "doctor_id",
            "weekday",
            "start_time",
            "end_time",
            name="uq_doctor_availability_interval",
        ),
    )


class DoctorAvailabilityPublic(DoctorAvailabilityBase):
    id: uuid.UUID
    doctor_id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DoctorAvailabilitiesPublic(SQLModel):
    data: list[DoctorAvailabilityPublic]
    count: int


class DoctorPublic(DoctorBase):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DoctorsPublic(SQLModel):
    data: list[DoctorPublic]
    count: int


class DoctorCreateWithUser(SQLModel):
    """Schema for creating a doctor with automatic user creation.

    This is the business-oriented input schema that combines
    user credentials with doctor profile information.

    The canonical field is `specialty`. The legacy field `specialization`
    is also accepted for backward compatibility.
    """

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(max_length=255)
    specialty: str | None = Field(default=None, max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    bio: str | None = Field(default=None, max_length=2000)
    experience_years: int | None = Field(default=None, ge=0)
    consultation_duration: int | None = Field(default=None, ge=5, le=180)
    is_active: bool = True


# =============================================================================
# Patient model
# =============================================================================
# The Patient is the central identity of the booking system.
# A Patient may exist without a User account (guest booking, reception-created).
# When a patient registers, Patient.user_id is linked to the User account.
# Appointments belong to the Patient record, never directly to the User.


class PatientBase(SQLModel):
    """Shared Patient fields."""

    full_name: str = Field(max_length=255)
    phone: str | None = Field(default=None, max_length=20, index=True)
    email: str | None = Field(default=None, max_length=255, index=True)


class PatientCreate(PatientBase):
    """Schema for creating a new Patient."""

    pass


class PatientUpdate(SQLModel):
    """Schema for updating an existing Patient. All fields optional."""

    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=255)


class Patient(PatientBase, table=True):
    __tablename__ = "patient"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="user.id",
        nullable=True,
        unique=True,
        ondelete="SET NULL",
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

    # Relationships
    user: Optional["User"] = Relationship(back_populates="patient")
    appointments: list["Appointment"] = Relationship(
        back_populates="patient",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    __table_args__ = (
        # Prevent duplicate patients by phone or email
        sa.UniqueConstraint("phone", name="uq_patient_phone"),
        sa.UniqueConstraint("email", name="uq_patient_email"),
    )


class PatientPublic(PatientBase):
    """Public view of a Patient. Includes id and timestamps, excludes user_id linkage."""

    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PatientAccountActivate(SQLModel):
    """Schema for activating a Patient account (linking to a new User)."""

    phone: str = Field(max_length=20)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class PatientAccountActivateResponse(SQLModel):
    """Response after successful patient account activation."""

    access_token: str
    token_type: str = "bearer"
    patient: PatientPublic


class PatientsPublic(SQLModel):
    data: list[PatientPublic]
    count: int


# =============================================================================
# Appointment model
# =============================================================================


class AppointmentBase(SQLModel):
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id", nullable=False, index=True)
    patient_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="patient.id",
        nullable=True,
        index=True,
        ondelete="SET NULL",
    )
    patient_name: str = Field(max_length=255)
    patient_phone: str = Field(max_length=20)
    patient_email: str | None = Field(default=None, max_length=255)
    contact_method: ContactMethod = Field(
        default=ContactMethod.PHONE,
        sa_type=sa.Enum(
            ContactMethod,
            values_callable=lambda enum_type: [e.value for e in enum_type],
        ),
    )
    appointment_date: date
    appointment_time: str = Field(max_length=5, regex=r"^([01]\d|2[0-3]):[0-5]\d$")
    status: AppointmentStatus = Field(
        default=AppointmentStatus.PENDING,
        sa_type=sa.Enum(
            AppointmentStatus,
            values_callable=lambda enum_type: [e.value for e in enum_type],
        ),
    )
    notes: str | None = Field(default=None, max_length=2000)
    booking_number: str | None = Field(default=None, max_length=30, nullable=True)


class AppointmentCreate(SQLModel):
    doctor_id: uuid.UUID
    patient_name: str = Field(max_length=255)
    patient_phone: str = Field(max_length=20)
    patient_email: str | None = Field(default=None, max_length=255)
    contact_method: ContactMethod = Field(default=ContactMethod.PHONE)
    appointment_date: date
    appointment_time: str = Field(max_length=5, regex=r"^([01]\d|2[0-3]):[0-5]\d$")
    notes: str | None = Field(default=None, max_length=2000)


class AppointmentStatusUpdate(SQLModel):
    status: AppointmentStatus


class Appointment(AppointmentBase, table=True):
    __tablename__ = "appointment"  # type: ignore[assignment]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
        sa_column_kwargs={"onupdate": get_datetime_utc},
    )
    doctor: Optional["Doctor"] = Relationship(back_populates="appointments")
    patient: Optional["Patient"] = Relationship(back_populates="appointments")

    __table_args__ = (
        # Prevent double booking for active appointments only.
        # Partial unique index allows CANCELLED appointments to coexist at the
        # same slot while preventing double-booking of PENDING or CONFIRMED.
        # This is critical for the cancel-and-rebook flow.
        sa.Index(
            "uq_appointment_slot_active",
            "doctor_id",
            "appointment_date",
            "appointment_time",
            unique=True,
            postgresql_where=sa.text("status IN ('pending', 'confirmed')"),
        ),
    )


class AppointmentPublic(AppointmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    doctor_name: str | None = None


class AppointmentPublicConfirmation(SQLModel):
    """Minimal appointment response for the unauthenticated public endpoint.

    Only exposes fields required by the booking confirmation page.
    Does NOT expose PII fields like patient_phone, patient_name, or notes.
    """

    id: uuid.UUID
    doctor_name: str | None = None
    appointment_date: date
    appointment_time: str
    booking_number: str | None = None
    patient_email: str | None = None
    status: AppointmentStatus


class AppointmentsPublic(SQLModel):
    data: list[AppointmentPublic]
    count: int


# Blocked Date model
class BlockedDateBase(SQLModel):
    blocked_date: date
    reason: str | None = Field(default=None, max_length=500)


class BlockedDateCreate(SQLModel):
    dates: list[date]
    reason: str | None = Field(default=None, max_length=500)


class BlockedDate(BlockedDateBase, table=True):
    __tablename__ = "blocked_dates"  # type: ignore[assignment]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doctor_id: uuid.UUID = Field(
        foreign_key="doctor.id",
        nullable=False,
        ondelete="CASCADE",
        index=True,
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    doctor: Optional["Doctor"] = Relationship(back_populates="blocked_dates")

    __table_args__ = (
        sa.UniqueConstraint(
            "doctor_id",
            "blocked_date",
            name="uq_blocked_date_per_doctor",
        ),
    )


class BlockedDatePublic(BlockedDateBase):
    id: uuid.UUID
    doctor_id: uuid.UUID
    created_at: datetime | None = None


class BlockedDatesPublic(SQLModel):
    data: list[BlockedDatePublic]
    count: int


# Slot Generator schemas
class AvailableSlot(SQLModel):
    """A single available booking slot."""

    time: str  # HH:MM format


class AvailableSlotsResponse(SQLModel):
    """Response containing all available slots for a doctor on a given date."""

    doctor_id: uuid.UUID
    date: date
    slots: list[AvailableSlot]
    count: int
    reason: str | None = None
    """Reason why no slots are available, when count is 0.
    One of: 'weekend', 'no_schedule', 'doctor_unavailable', 'fully_booked',
    or None if slots exist.
    """


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
