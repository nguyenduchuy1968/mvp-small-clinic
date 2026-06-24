import re
import uuid
from datetime import date, datetime
from zoneinfo import ZoneInfo
from typing import Any

from sqlalchemy import text

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models import (
    Appointment,
    AppointmentCreate,
    AppointmentPublic,
    AppointmentPublicConfirmation,
    AppointmentStatus,
    AppointmentStatusUpdate,
    BlockedDate,
    BlockedDateCreate,
    BlockedDatePublic,
    BlockedDatesPublic,
    ContactMethod,
    Doctor,
    DoctorAvailability,
    DoctorAvailabilityCreate,
    DoctorAvailabilityUpdate,
    DoctorCreate,
    DoctorCreateWithUser,
    DoctorUpdate,
    User,
    UserCreate,
    UserRole,
    UserUpdate,
    Weekday,
)
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user


def create_doctor_with_user(
    *, session: Session, doctor_in: DoctorCreateWithUser
) -> Doctor:
    """Atomically create a User (role=DOCTOR) and a Doctor profile.

    If Doctor creation fails, User creation is rolled back.
    """
    # 1. Create User with role=DOCTOR
    user_create = UserCreate(
        email=doctor_in.email,
        password=doctor_in.password,
        full_name=doctor_in.full_name,
        role=UserRole.DOCTOR,
        is_active=True,
    )
    user = create_user(session=session, user_create=user_create)

    try:
        # 2. Create Doctor profile linked to the user
        # `specialty` is the canonical field; `specialization` is accepted for backward compatibility
        doctor_create = DoctorCreate(
            full_name=doctor_in.full_name,
            specialty=doctor_in.specialty or doctor_in.specialization,
            experience_years=doctor_in.experience_years,
            bio=doctor_in.bio,
            phone=doctor_in.phone,
            consultation_duration=doctor_in.consultation_duration,
            is_active=doctor_in.is_active,
        )
        db_obj = Doctor.model_validate(doctor_create, update={"user_id": user.id})
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj
    except Exception:
        session.rollback()
        raise


def create_doctor(
    *, session: Session, doctor_create: DoctorCreate, user_id: uuid.UUID
) -> Doctor:
    db_obj = Doctor.model_validate(doctor_create, update={"user_id": user_id})
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_doctor(*, session: Session, doctor_id: uuid.UUID) -> Doctor | None:
    return session.get(Doctor, doctor_id)


def get_doctors(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Doctor], int]:
    count_statement = select(Doctor).where(Doctor.is_active == True)
    count = len(session.exec(count_statement).all())

    statement = select(Doctor).where(Doctor.is_active == True).offset(skip).limit(limit)
    doctors = session.exec(statement).all()
    return list(doctors), count


def update_doctor(
    *, session: Session, db_doctor: Doctor, doctor_in: DoctorUpdate
) -> Doctor:
    doctor_data = doctor_in.model_dump(exclude_unset=True)

    # Extract User-specific fields (email, password) before updating Doctor
    user_update_data: dict[str, Any] = {}
    if "email" in doctor_data:
        user_update_data["email"] = doctor_data.pop("email")
    if "password" in doctor_data:
        user_update_data["password"] = doctor_data.pop("password")

    # Update Doctor fields
    db_doctor.sqlmodel_update(doctor_data)
    session.add(db_doctor)
    session.commit()
    session.refresh(db_doctor)

    # Update linked User fields (email/password) if provided
    if user_update_data:
        # Eagerly load the user relationship to ensure it's available
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Doctor)
            .where(Doctor.id == db_doctor.id)
            .options(selectinload(Doctor.user))
        )
        fresh_doctor = session.exec(stmt).first()
        if fresh_doctor and fresh_doctor.user:
            user_update = UserUpdate(**user_update_data)
            update_user(session=session, db_user=fresh_doctor.user, user_in=user_update)
            # Re-fetch to get the updated user data
            session.refresh(fresh_doctor)
        return fresh_doctor or db_doctor

    return db_doctor


def delete_doctor(*, session: Session, db_doctor: Doctor) -> None:
    session.delete(db_doctor)
    session.commit()


# =============================================================================
# Doctor Availability CRUD
# =============================================================================


def _parse_time(time_str: str) -> tuple[int, int]:
    """Parse HH:MM string into (hours, minutes) tuple for comparison."""
    parts = time_str.split(":")
    return int(parts[0]), int(parts[1])


def _time_to_minutes(time_str: str) -> int:
    """Convert HH:MM string to total minutes since midnight."""
    hours, minutes = _parse_time(time_str)
    return hours * 60 + minutes


def _intervals_overlap(
    existing_start: str,
    existing_end: str,
    new_start: str,
    new_end: str,
) -> bool:
    """Check if two time intervals overlap.

    Intervals that touch (e.g., 09:00-12:00 and 12:00-17:00) are NOT considered
    overlapping. This is the correct behavior for scheduling adjacent shifts.
    """
    return _time_to_minutes(new_start) < _time_to_minutes(
        existing_end
    ) and _time_to_minutes(new_end) > _time_to_minutes(existing_start)


def _validate_availability_time_range(
    start_time: str,
    end_time: str,
) -> None:
    """Validate that the time range is semantically correct.

    Raises ValueError if:
    - start_time >= end_time (zero-length or negative interval)
    """
    start_minutes = _time_to_minutes(start_time)
    end_minutes = _time_to_minutes(end_time)

    if start_minutes >= end_minutes:
        raise ValueError(
            f"end_time ({end_time}) must be after start_time ({start_time})"
        )


def _validate_duration_minutes(
    start_time: str,
    end_time: str,
    duration_minutes: int,
) -> None:
    """Validate duration_minutes against the interval length.

    Raises ValueError if:
    - duration_minutes <= 0
    - duration_minutes > interval length in minutes
    """
    if duration_minutes <= 0:
        raise ValueError("duration_minutes must be greater than 0")

    interval_minutes = _time_to_minutes(end_time) - _time_to_minutes(start_time)
    if duration_minutes > interval_minutes:
        raise ValueError(
            f"duration_minutes ({duration_minutes}) cannot exceed the interval length "
            f"({interval_minutes} minutes between {start_time} and {end_time})"
        )


def _check_overlapping_availability(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    weekday: Weekday,
    start_time: str,
    end_time: str,
    exclude_id: uuid.UUID | None = None,
) -> None:
    """Check if a new availability interval overlaps with existing ones.

    Args:
        session: Database session.
        doctor_id: The doctor's UUID.
        weekday: The weekday to check.
        start_time: New interval start (HH:MM).
        end_time: New interval end (HH:MM).
        exclude_id: If set, exclude this availability ID from overlap check
                    (used during updates).

    Raises ValueError if an overlapping interval is found.
    """
    statement = select(DoctorAvailability).where(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.weekday == weekday,
        DoctorAvailability.is_active == True,
    )

    if exclude_id is not None:
        statement = statement.where(DoctorAvailability.id != exclude_id)

    existing_records = session.exec(statement).all()

    for existing in existing_records:
        if _intervals_overlap(
            existing.start_time,
            existing.end_time,
            start_time,
            end_time,
        ):
            raise ValueError(
                f"Availability interval {start_time}-{end_time} on "
                f"{weekday.value} overlaps with existing interval "
                f"{existing.start_time}-{existing.end_time}"
            )


def create_doctor_availability(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    availability_in: DoctorAvailabilityCreate,
) -> DoctorAvailability:
    """Create a new doctor availability record.

    Validates:
    - Doctor exists
    - Time range is valid (end_time > start_time)
    - duration_minutes is valid (> 0 and <= interval length)
    - No overlapping intervals for the same doctor/weekday
    - No duplicate interval (handled by DB unique constraint)

    Raises ValueError on validation failure.
    """
    # 1. Verify doctor exists
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise ValueError(f"Doctor with id {doctor_id} not found")

    # 2. Validate time range
    _validate_availability_time_range(
        availability_in.start_time, availability_in.end_time
    )

    # 3. Validate duration_minutes
    _validate_duration_minutes(
        availability_in.start_time,
        availability_in.end_time,
        availability_in.duration_minutes,
    )

    # 4. Check for overlapping intervals
    _check_overlapping_availability(
        session=session,
        doctor_id=doctor_id,
        weekday=availability_in.weekday,
        start_time=availability_in.start_time,
        end_time=availability_in.end_time,
    )

    # 5. Create the record
    db_obj = DoctorAvailability.model_validate(
        availability_in, update={"doctor_id": doctor_id}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_doctor_availability(
    *,
    session: Session,
    availability_id: uuid.UUID,
) -> DoctorAvailability | None:
    """Get a single doctor availability record by ID."""
    return session.get(DoctorAvailability, availability_id)


def get_doctor_availabilities(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    weekday: Weekday | None = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[DoctorAvailability], int]:
    """Get all availability records for a doctor.

    Args:
        session: Database session.
        doctor_id: The doctor's UUID.
        weekday: Optional filter by specific weekday.
        active_only: If True (default), only return active records.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return (pagination).

    Returns:
        Tuple of (list of records, total count).
    """
    # Build count query
    count_statement = select(DoctorAvailability).where(
        DoctorAvailability.doctor_id == doctor_id,
    )
    if weekday is not None:
        count_statement = count_statement.where(DoctorAvailability.weekday == weekday)
    if active_only:
        count_statement = count_statement.where(DoctorAvailability.is_active == True)
    count = len(session.exec(count_statement).all())

    # Build data query with deterministic ordering
    # PostgreSQL ENUM sorts by declaration order (calendar order: monday=0..sunday=6)
    statement = select(DoctorAvailability).where(
        DoctorAvailability.doctor_id == doctor_id
    )
    if weekday is not None:
        statement = statement.where(DoctorAvailability.weekday == weekday)
    if active_only:
        statement = statement.where(DoctorAvailability.is_active == True)
    statement = (
        statement.order_by(
            DoctorAvailability.weekday,
            DoctorAvailability.start_time.asc(),
        )
        .offset(skip)
        .limit(limit)
    )

    records = session.exec(statement).all()
    return list(records), count


def update_doctor_availability(
    *,
    session: Session,
    db_availability: DoctorAvailability,
    availability_in: DoctorAvailabilityUpdate,
) -> DoctorAvailability:
    """Update a doctor availability record.

    Validates:
    - Time range is valid if start_time or end_time changed
    - duration_minutes is valid if provided
    - No overlapping intervals with other records for the same doctor/weekday

    Raises ValueError on validation failure.
    """
    # Get the effective values (existing + updates)
    effective_start = (
        availability_in.start_time
        if availability_in.start_time is not None
        else db_availability.start_time
    )
    effective_end = (
        availability_in.end_time
        if availability_in.end_time is not None
        else db_availability.end_time
    )
    effective_weekday = (
        availability_in.weekday
        if availability_in.weekday is not None
        else db_availability.weekday
    )
    effective_duration = (
        availability_in.duration_minutes
        if availability_in.duration_minutes is not None
        else db_availability.duration_minutes
    )

    # 1. Validate time range if times changed
    if availability_in.start_time is not None or availability_in.end_time is not None:
        _validate_availability_time_range(effective_start, effective_end)

    # 2. Validate duration_minutes if provided
    if availability_in.duration_minutes is not None:
        _validate_duration_minutes(effective_start, effective_end, effective_duration)

    # 3. Check for overlapping intervals (exclude self)
    _check_overlapping_availability(
        session=session,
        doctor_id=db_availability.doctor_id,
        weekday=effective_weekday,
        start_time=effective_start,
        end_time=effective_end,
        exclude_id=db_availability.id,
    )

    # 4. Apply update
    availability_data = availability_in.model_dump(exclude_unset=True)
    db_availability.sqlmodel_update(availability_data)
    session.add(db_availability)
    session.commit()
    session.refresh(db_availability)
    return db_availability


def delete_doctor_availability(
    *,
    session: Session,
    db_availability: DoctorAvailability,
) -> None:
    """Delete a doctor availability record."""
    session.delete(db_availability)
    session.commit()


# =============================================================================
# Appointment CRUD
# =============================================================================


def _get_today_local() -> date:
    """Get today's date in the clinic's local timezone.

    Uses settings.CLINIC_TIMEZONE (default: Asia/Ho_Chi_Minh).
    All date comparisons for appointment availability must use
    the clinic's local time, not UTC.
    """
    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    return datetime.now(clinic_tz).date()


def _time_to_minutes(time_str: str) -> int:
    """Convert HH:MM string to total minutes since midnight."""
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def _format_time(minutes: int) -> str:
    """Convert total minutes since midnight to HH:MM string."""
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


def _validate_doctor_active(*, session: Session, doctor_id: uuid.UUID) -> Doctor:
    """Validate doctor exists and is active.

    Raises ValueError if doctor not found or not active.
    Returns the doctor object.
    """
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise ValueError(f"Doctor with id {doctor_id} not found")
    if not doctor.is_active:
        raise ValueError(f"Doctor with id {doctor_id} is not active")
    return doctor


def _validate_appointment_date(
    *, appointment_date: date, appointment_time: str
) -> None:
    """Validate that the appointment date/time is not in the past.

    Uses the clinic's local timezone (settings.CLINIC_TIMEZONE) for all
    comparisons, ensuring that slot times stored in local time are correctly
    evaluated against the current local time at the clinic.

    Raises ValueError if the appointment is in the past.
    """
    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    now_local = datetime.now(clinic_tz)
    today_local = now_local.date()

    if appointment_date < today_local:
        raise ValueError(
            f"Appointment date {appointment_date} is in the past. "
            f"Today is {today_local}."
        )

    if appointment_date == today_local:
        # Check that the time hasn't passed yet
        current_minutes = now_local.hour * 60 + now_local.minute
        appointment_minutes = _time_to_minutes(appointment_time)

        if appointment_minutes <= current_minutes:
            raise ValueError(
                f"Appointment time {appointment_time} has already passed today. "
                f"Current time is {now_local.hour:02d}:{now_local.minute:02d}."
            )


def _validate_availability_window(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    appointment_date: date,
    appointment_time: str,
) -> None:
    """Validate that the appointment time aligns with a generated slot boundary.

    For each matching availability interval, the appointment time must:
    1. Be at or after the interval start_time (offset >= 0)
    2. Be strictly before the interval end_time (can complete within window)
    3. Align with a slot boundary: offset_minutes % duration_minutes == 0

    Example: 09:00-12:00 with duration=30
      Valid:   09:00, 09:30, 10:00, 10:30, 11:00, 11:30
      Invalid: 09:05, 09:17, 10:42, 11:15

    Raises ValueError if no matching slot is found.
    """
    # Determine the weekday of the appointment date
    weekday_name = appointment_date.strftime("%A").lower()  # e.g., "monday"

    # Map to Weekday enum
    weekday_map = {
        "monday": Weekday.MONDAY,
        "tuesday": Weekday.TUESDAY,
        "wednesday": Weekday.WEDNESDAY,
        "thursday": Weekday.THURSDAY,
        "friday": Weekday.FRIDAY,
        "saturday": Weekday.SATURDAY,
        "sunday": Weekday.SUNDAY,
    }
    weekday = weekday_map.get(weekday_name)
    if weekday is None:
        raise ValueError(f"Invalid weekday: {weekday_name}")

    # Find active availability intervals for this doctor/weekday
    statement = select(DoctorAvailability).where(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.weekday == weekday,
        DoctorAvailability.is_active == True,
    )
    intervals = session.exec(statement).all()

    if not intervals:
        raise ValueError(
            f"No active availability found for doctor {doctor_id} " f"on {weekday_name}"
        )

    appointment_minutes = _time_to_minutes(appointment_time)

    # Check if appointment time matches a generated slot boundary
    for interval in intervals:
        start_minutes = _time_to_minutes(interval.start_time)
        end_minutes = _time_to_minutes(interval.end_time)
        slot_duration = interval.duration_minutes

        # Step 1: Range check — must be within the interval
        if not (start_minutes <= appointment_minutes < end_minutes):
            continue

        # Step 2: Slot alignment check — offset must be a multiple of duration
        offset_minutes = appointment_minutes - start_minutes
        if offset_minutes % slot_duration == 0:
            return  # Valid slot

        # Time is in range but not on a slot boundary
        raise ValueError(
            f"Appointment time {appointment_time} does not align with "
            f"any available slot for doctor {doctor_id} on {weekday_name}. "
            f"Slots are every {slot_duration} minutes starting from "
            f"{interval.start_time} (e.g., "
            f"{interval.start_time}, "
            f"{_format_time(start_minutes + slot_duration)}, ...)."
        )

    raise ValueError(
        f"Appointment time {appointment_time} does not fall within any "
        f"active availability interval for doctor {doctor_id} on {weekday_name}"
    )


# Vietnam phone number regex pattern
# Supports:
#   - +84[3-9]XXXXXXXXX (international format)
#   - 0[3-9]XXXXXXXXX   (domestic format)
# Strips spaces, dashes, dots, and parentheses before matching
PHONE_PATTERN = re.compile(r"^(\+84|0)[3-9]\d{8,9}$")


def _normalize_phone(phone: str) -> str:
    """Remove common phone number separators for validation."""
    return re.sub(r"[\s\-\.\(\)]", "", phone)


def _validate_phone_format(*, patient_phone: str) -> None:
    """Validate phone number format.

    Supports Vietnam phone numbers:
      - International: +84[3-9]XXXXXXXXX (11 digits after +84)
      - Domestic: 0[3-9]XXXXXXXXX (10 digits)

    Raises ValueError if the phone number format is invalid.
    """
    if not patient_phone or not patient_phone.strip():
        raise ValueError("patient_phone is required")

    normalized = _normalize_phone(patient_phone)
    if not PHONE_PATTERN.match(normalized):
        raise ValueError(
            "Invalid phone number format. "
            "Please enter a valid Vietnam phone number "
            "(e.g., +84 123 456 789 or 0123 456 789)"
        )


def _validate_contact_info(
    *,
    contact_method: ContactMethod,
    patient_phone: str,
    patient_email: str | None,
) -> None:
    """Validate that required contact fields are provided based on contact method.

    - PHONE / WHATSAPP / VIBER / ZALO: patient_phone is required
    - EMAIL: patient_email is required
    - TELEGRAM: at least one contact field is required

    Also validates phone number format for all methods that require a phone.

    Raises ValueError on validation failure.
    """
    phone_required_methods = {
        ContactMethod.PHONE,
        ContactMethod.WHATSAPP,
        ContactMethod.VIBER,
        ContactMethod.ZALO,
    }

    if contact_method in phone_required_methods:
        if not patient_phone or not patient_phone.strip():
            raise ValueError(
                f"patient_phone is required for contact method '{contact_method.value}'"
            )
        _validate_phone_format(patient_phone=patient_phone)

    if contact_method == ContactMethod.EMAIL:
        if not patient_email or not patient_email.strip():
            raise ValueError("patient_email is required for contact method 'email'")

    if contact_method == ContactMethod.TELEGRAM:
        has_phone = bool(patient_phone and patient_phone.strip())
        has_email = bool(patient_email and patient_email.strip())
        if not has_phone and not has_email:
            raise ValueError(
                "At least one of patient_phone or patient_email is required "
                "for contact method 'telegram'"
            )
        if has_phone:
            _validate_phone_format(patient_phone=patient_phone)


def _check_double_booking(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    appointment_date: date,
    appointment_time: str,
    exclude_id: uuid.UUID | None = None,
) -> None:
    """Check if the slot is already booked with a non-cancelled appointment.

    Only PENDING or CONFIRMED appointments block the slot.
    CANCELLED appointments do not block re-booking.

    Raises ValueError if the slot is already taken.
    """
    statement = select(Appointment).where(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == appointment_date,
        Appointment.appointment_time == appointment_time,
        Appointment.status.in_(
            [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
        ),
    )

    if exclude_id is not None:
        statement = statement.where(Appointment.id != exclude_id)

    existing = session.exec(statement).first()
    if existing is not None:
        raise ValueError(
            f"Slot on {appointment_date} at {appointment_time} for "
            f"doctor {doctor_id} is already booked (status: {existing.status.value})"
        )


def _validate_status_transition(
    current_status: AppointmentStatus,
    new_status: AppointmentStatus,
) -> None:
    """Validate appointment status transition.

    Allowed transitions:
      - PENDING -> CONFIRMED
      - PENDING -> CANCELLED
      - CONFIRMED -> CANCELLED

    Rejected transitions:
      - CANCELLED -> PENDING
      - CANCELLED -> CONFIRMED
      - CONFIRMED -> PENDING

    Raises ValueError on invalid transition.
    """
    valid_transitions = {
        AppointmentStatus.PENDING: {
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
        },
        AppointmentStatus.CONFIRMED: {AppointmentStatus.CANCELLED},
        AppointmentStatus.CANCELLED: set(),  # No transitions allowed from CANCELLED
    }

    allowed = valid_transitions.get(current_status, set())
    if new_status not in allowed:
        raise ValueError(
            f"Invalid status transition: {current_status.value} -> {new_status.value}. "
            f"Allowed transitions from '{current_status.value}' are: "
            f"{', '.join(s.value for s in allowed) if allowed else 'none'}"
        )


def _generate_booking_number(session: Session) -> str:
    """Generate a unique booking reference number using a DB sequence.

    Format: BK-000001, BK-000002, ...
    Uses PostgreSQL sequence for atomic, race-condition-free generation.
    """
    result = session.execute(
        text("SELECT 'BK-' || LPAD(nextval('booking_number_seq')::text, 6, '0')")
    )
    return result.scalar()


def _appointment_to_public(appointment: Appointment) -> AppointmentPublic:
    """Convert an Appointment DB model to AppointmentPublic with doctor_name."""
    doctor_name = None
    if appointment.doctor is not None:
        doctor_name = appointment.doctor.full_name
    return AppointmentPublic(
        id=appointment.id,
        doctor_id=appointment.doctor_id,
        patient_name=appointment.patient_name,
        patient_phone=appointment.patient_phone,
        patient_email=appointment.patient_email,
        contact_method=appointment.contact_method,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        status=appointment.status,
        notes=appointment.notes,
        booking_number=appointment.booking_number,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
        doctor_name=doctor_name,
    )


def _appointment_to_public_confirmation(
    appointment: Appointment,
) -> AppointmentPublicConfirmation:
    """Convert an Appointment DB model to AppointmentPublicConfirmation.

    This is a minimal response model for the unauthenticated public endpoint.
    Only exposes fields required by the booking confirmation page.
    Does NOT expose patient_phone, patient_name, notes, or other PII.
    """
    doctor_name = None
    if appointment.doctor is not None:
        doctor_name = appointment.doctor.full_name
    return AppointmentPublicConfirmation(
        id=appointment.id,
        doctor_name=doctor_name,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        booking_number=appointment.booking_number,
        patient_email=appointment.patient_email,
        status=appointment.status,
    )


def _validate_not_blocked_date(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    appointment_date: date,
) -> None:
    """Validate that the given date is not blocked for the doctor.

    Raises ValueError if the date is blocked.
    """
    statement = select(BlockedDate).where(
        BlockedDate.doctor_id == doctor_id,
        BlockedDate.blocked_date == appointment_date,
    )
    blocked = session.exec(statement).first()
    if blocked is not None:
        raise ValueError(
            f"Doctor {doctor_id} has blocked date {appointment_date}: "
            f"{blocked.reason or 'No reason provided'}"
        )


def create_blocked_dates(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    blocked_dates_in: BlockedDateCreate,
) -> BlockedDatesPublic:
    """Create blocked dates for a doctor.

    Accepts a list of dates and a reason. Creates one row per date.
    Validates that each date is not in the past (clinic local timezone).

    Args:
        session: Database session.
        doctor_id: UUID of the doctor.
        blocked_dates_in: BlockedDateCreate with dates list and reason.

    Returns:
        BlockedDatesPublic with the created BlockedDatePublic records.

    Raises:
        ValueError: If any date is in the past or already blocked.
    """
    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    today_local = datetime.now(clinic_tz).date()

    created_records: list[BlockedDatePublic] = []

    for blocked_date in blocked_dates_in.dates:
        # Validate date is not in the past
        if blocked_date < today_local:
            raise ValueError(
                f"Cannot block past date {blocked_date}. "
                f"Today is {today_local} (clinic local time)."
            )

        db_obj = BlockedDate(
            doctor_id=doctor_id,
            blocked_date=blocked_date,
            reason=blocked_dates_in.reason,
        )
        session.add(db_obj)
        try:
            session.flush()
        except IntegrityError as exc:
            session.rollback()
            if "uq_blocked_date_per_doctor" in str(exc):
                raise ValueError(
                    f"Date {blocked_date} is already blocked for doctor {doctor_id}"
                )
            raise

        created_records.append(
            BlockedDatePublic(
                id=db_obj.id,
                doctor_id=db_obj.doctor_id,
                blocked_date=db_obj.blocked_date,
                reason=db_obj.reason,
                created_at=db_obj.created_at,
            )
        )

    session.commit()
    return BlockedDatesPublic(data=created_records, count=len(created_records))


def get_blocked_dates(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[BlockedDatePublic], int]:
    """Get blocked dates for a doctor, ordered by date ascending.

    Args:
        session: Database session.
        doctor_id: UUID of the doctor.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return.

    Returns:
        Tuple of (list of BlockedDatePublic, total count).
    """
    # Count
    count_statement = select(BlockedDate).where(
        BlockedDate.doctor_id == doctor_id,
    )
    count = len(session.exec(count_statement).all())

    # Data
    statement = (
        select(BlockedDate)
        .where(BlockedDate.doctor_id == doctor_id)
        .order_by(BlockedDate.blocked_date.asc())
        .offset(skip)
        .limit(limit)
    )
    records = session.exec(statement).all()

    result = [
        BlockedDatePublic(
            id=r.id,
            doctor_id=r.doctor_id,
            blocked_date=r.blocked_date,
            reason=r.reason,
            created_at=r.created_at,
        )
        for r in records
    ]
    return result, count


def delete_blocked_date(
    *,
    session: Session,
    blocked_date_id: uuid.UUID,
) -> None:
    """Delete a blocked date record.

    Args:
        session: Database session.
        blocked_date_id: UUID of the blocked date record to delete.

    Raises:
        ValueError: If the blocked date record is not found.
    """
    statement = select(BlockedDate).where(BlockedDate.id == blocked_date_id)
    db_obj = session.exec(statement).first()
    if db_obj is None:
        raise ValueError(f"Blocked date {blocked_date_id} not found")
    session.delete(db_obj)
    session.commit()


def create_appointment(
    *,
    session: Session,
    appointment_in: AppointmentCreate,
) -> Appointment:
    """Create a new appointment.

    Validates:
    1. Doctor exists and is active
    2. Appointment date is not in the past
    3. Appointment time falls within an active availability interval
    4. Contact info is valid for the selected contact method
    5. No double booking (same doctor, date, time with PENDING or CONFIRMED status)

    The appointment status is determined by the AUTO_CONFIRM_APPOINTMENTS setting:
    - True  → CONFIRMED (MVP default)
    - False → PENDING  (for clinics requiring manual approval)

    Raises ValueError on validation failure.

    Catches IntegrityError from database unique constraint violations
    (race condition protection) and raises ValueError with a clear message,
    which the API layer converts to HTTP 409 Conflict.
    """
    # 1. Validate doctor exists and is active
    _validate_doctor_active(session=session, doctor_id=appointment_in.doctor_id)

    # 2. Validate appointment date is not in the past
    _validate_appointment_date(
        appointment_date=appointment_in.appointment_date,
        appointment_time=appointment_in.appointment_time,
    )

    # 2.5 Validate date is not blocked for this doctor
    _validate_not_blocked_date(
        session=session,
        doctor_id=appointment_in.doctor_id,
        appointment_date=appointment_in.appointment_date,
    )

    # 3. Validate appointment time falls within availability
    _validate_availability_window(
        session=session,
        doctor_id=appointment_in.doctor_id,
        appointment_date=appointment_in.appointment_date,
        appointment_time=appointment_in.appointment_time,
    )

    # 4. Validate contact info
    _validate_contact_info(
        contact_method=appointment_in.contact_method,
        patient_phone=appointment_in.patient_phone,
        patient_email=appointment_in.patient_email,
    )

    # 5. Check for double booking
    _check_double_booking(
        session=session,
        doctor_id=appointment_in.doctor_id,
        appointment_date=appointment_in.appointment_date,
        appointment_time=appointment_in.appointment_time,
    )

    # 6. Determine appointment status based on auto-confirm setting
    if settings.AUTO_CONFIRM_APPOINTMENTS:
        appointment_status = AppointmentStatus.CONFIRMED
    else:
        appointment_status = AppointmentStatus.PENDING

    # 7. Create the appointment with the determined status
    appointment_data = appointment_in.model_dump()
    appointment_data["status"] = appointment_status

    # 8. Generate booking number before commit (uses PostgreSQL sequence)
    appointment_data["booking_number"] = _generate_booking_number(session)

    db_obj = Appointment.model_validate(appointment_data)
    session.add(db_obj)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        # Check if it's the unique index for double booking
        # (partial index uq_appointment_slot_active only applies to
        #  PENDING/CONFIRMED, so this correctly allows re-booking cancelled slots)
        if "uq_appointment_slot_active" in str(exc):
            raise ValueError(
                f"Slot on {appointment_in.appointment_date} at "
                f"{appointment_in.appointment_time} for "
                f"doctor {appointment_in.doctor_id} is already booked"
            )
        raise
    session.refresh(db_obj)
    return _appointment_to_public(db_obj)


def get_appointment(
    *,
    session: Session,
    appointment_id: uuid.UUID,
) -> AppointmentPublic | None:
    """Get a single appointment by ID with doctor_name populated."""
    statement = select(Appointment).where(Appointment.id == appointment_id)
    appointment = session.exec(statement).first()
    if appointment is None:
        return None
    return _appointment_to_public(appointment)


def get_appointments(
    *,
    session: Session,
    doctor_id: uuid.UUID | None = None,
    appointment_date: date | None = None,
    status: AppointmentStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[AppointmentPublic], int]:
    """Get appointments with optional filters and doctor_name populated.

    Args:
        session: Database session.
        doctor_id: Optional filter by doctor.
        appointment_date: Optional filter by date.
        status: Optional filter by status.
        skip: Number of records to skip (pagination).
        limit: Maximum number of records to return (pagination).

    Returns:
        Tuple of (list of AppointmentPublic with doctor_name, total count).
    """
    # Build count query
    count_statement = select(Appointment)
    if doctor_id is not None:
        count_statement = count_statement.where(Appointment.doctor_id == doctor_id)
    if appointment_date is not None:
        count_statement = count_statement.where(
            Appointment.appointment_date == appointment_date
        )
    if status is not None:
        count_statement = count_statement.where(Appointment.status == status)
    count = len(session.exec(count_statement).all())

    # Build data query with deterministic ordering — newest first
    statement = select(Appointment)
    if doctor_id is not None:
        statement = statement.where(Appointment.doctor_id == doctor_id)
    if appointment_date is not None:
        statement = statement.where(Appointment.appointment_date == appointment_date)
    if status is not None:
        statement = statement.where(Appointment.status == status)
    statement = (
        statement.order_by(Appointment.created_at.desc()).offset(skip).limit(limit)
    )

    records = session.exec(statement).all()
    return [_appointment_to_public(r) for r in records], count


def update_appointment_status(
    *,
    session: Session,
    db_appointment: Appointment,
    status_update: AppointmentStatusUpdate,
) -> AppointmentPublic:
    """Update an appointment's status with transition validation.

    Validates:
    1. Status transition is allowed (see _validate_status_transition)

    Raises ValueError on invalid transition.
    """
    # 1. Validate status transition
    _validate_status_transition(db_appointment.status, status_update.status)

    # 2. Apply update
    db_appointment.status = status_update.status
    session.add(db_appointment)
    session.commit()
    session.refresh(db_appointment)
    return _appointment_to_public(db_appointment)


def delete_appointment(
    *,
    session: Session,
    db_appointment: Appointment,
) -> None:
    """Delete an appointment record."""
    session.delete(db_appointment)
    session.commit()
