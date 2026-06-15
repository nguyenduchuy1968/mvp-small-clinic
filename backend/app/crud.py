import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
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
        db_obj = Doctor.model_validate(
            doctor_create, update={"user_id": user.id}
        )
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
    db_obj = Doctor.model_validate(
        doctor_create, update={"user_id": user_id}
    )
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

    statement = (
        select(Doctor)
        .where(Doctor.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    doctors = session.exec(statement).all()
    return list(doctors), count


def update_doctor(
    *, session: Session, db_doctor: Doctor, doctor_in: DoctorUpdate
) -> Doctor:
    doctor_data = doctor_in.model_dump(exclude_unset=True)
    db_doctor.sqlmodel_update(doctor_data)
    session.add(db_doctor)
    session.commit()
    session.refresh(db_doctor)
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
    return _time_to_minutes(new_start) < _time_to_minutes(existing_end) and _time_to_minutes(
        new_end
    ) > _time_to_minutes(existing_start)


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
        count_statement = count_statement.where(
            DoctorAvailability.weekday == weekday
        )
    if active_only:
        count_statement = count_statement.where(
            DoctorAvailability.is_active == True
        )
    count = len(session.exec(count_statement).all())

    # Build data query with deterministic ordering
    # PostgreSQL ENUM sorts by declaration order (calendar order: monday=0..sunday=6)
    statement = (
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == doctor_id)
    )
    if weekday is not None:
        statement = statement.where(DoctorAvailability.weekday == weekday)
    if active_only:
        statement = statement.where(DoctorAvailability.is_active == True)
    statement = statement.order_by(
        DoctorAvailability.weekday,
        DoctorAvailability.start_time.asc(),
    ).offset(skip).limit(limit)

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
        _validate_duration_minutes(
            effective_start, effective_end, effective_duration
        )

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
