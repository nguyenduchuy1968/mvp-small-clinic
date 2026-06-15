import uuid
from typing import Any

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models import (
    Doctor,
    DoctorAvailabilitiesPublic,
    DoctorAvailability,
    DoctorAvailabilityCreate,
    DoctorAvailabilityPublic,
    DoctorAvailabilityUpdate,
    Message,
    User,
    UserRole,
)
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(tags=["availability"])


def _get_doctor_or_404(*, session: SessionDep, doctor_id: uuid.UUID) -> Doctor:
    """Get a doctor by ID or raise 404."""
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor


def _get_availability_or_404(
    *, session: SessionDep, availability_id: uuid.UUID
) -> DoctorAvailability:
    """Get an availability record by ID or raise 404."""
    availability = crud.get_doctor_availability(
        session=session, availability_id=availability_id
    )
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability not found",
        )
    return availability


def _check_doctor_access(*, current_user: User, doctor_id: uuid.UUID) -> None:
    """Check if the current user can access the given doctor's data.

    Admins can access any doctor. Doctors can only access their own data.
    """
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return
    # Doctor must be accessing their own availability
    if current_user.doctor is None or current_user.doctor.id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )


def _check_availability_ownership(
    *, current_user: User, availability: DoctorAvailability
) -> None:
    """Check if the current user owns the given availability record.

    Admins can access any record. Doctors can only access their own records.
    """
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return
    # Doctor must own this availability record
    if current_user.doctor is None or current_user.doctor.id != availability.doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )


def _handle_crud_error(exc: ValueError) -> None:
    """Convert CRUD ValueError to appropriate HTTP exception.

    Mapping:
    - "not found" → 404
    - "overlap" → 409
    - "Invalid time range" / "Invalid duration" → 400
    - Everything else → 400
    """
    detail = str(exc)
    lower_detail = detail.lower()

    if "not found" in lower_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )
    if "overlap" in lower_detail:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )
    if "invalid time range" in lower_detail or "invalid duration" in lower_detail:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )
    # Default to 400 for any other validation error
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail,
    )


@router.get(
    "/doctors/{doctor_id}/availability",
    response_model=DoctorAvailabilitiesPublic,
    summary="Get Doctor Availability",
    description=(
        "Retrieve availability slots for a specific doctor. "
        "Supports pagination via `skip` and `limit` parameters. "
        "Use `active_only=false` to include inactive slots. "
        "Results are ordered by weekday (Monday→Sunday) and then by start time."
    ),
)
def read_doctor_availabilities(
    doctor_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
) -> Any:
    """
    Retrieve availability slots for a specific doctor.

    Parameters:
    - **doctor_id**: UUID of the doctor
    - **skip**: Number of records to skip (pagination, default: 0)
    - **limit**: Maximum records to return (pagination, default: 100)
    - **active_only**: If True (default), only return active slots

    Returns:
    - **data**: List of availability slots
    - **count**: Total number of matching records
    """
    # Verify doctor exists
    _get_doctor_or_404(session=session, doctor_id=doctor_id)

    # Check permissions
    _check_doctor_access(current_user=current_user, doctor_id=doctor_id)

    records, total = crud.get_doctor_availabilities(
        session=session,
        doctor_id=doctor_id,
        active_only=active_only,
        skip=skip,
        limit=limit,
    )
    return DoctorAvailabilitiesPublic(data=records, count=total)


@router.post(
    "/doctors/{doctor_id}/availability",
    response_model=DoctorAvailabilityPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create Doctor Availability",
    description=(
        "Create a new availability slot for a doctor. "
        "Validates that the time range is valid (end > start), "
        "duration_minutes does not exceed the interval length, "
        "and the slot does not overlap with existing slots. "
        "Touching intervals (e.g., 09:00-10:00 and 10:00-11:00) are allowed."
    ),
)
def create_doctor_availability(
    doctor_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    availability_in: DoctorAvailabilityCreate,
) -> Any:
    """
    Create a new availability slot for a doctor.

    Parameters:
    - **doctor_id**: UUID of the doctor
    - **Request body**: Availability slot details (weekday, start_time, end_time, duration_minutes, is_active)

    Returns:
    - The created availability slot with all fields, including id and timestamps.

    Errors:
    - **404**: Doctor not found
    - **400**: Invalid time range or duration
    - **409**: Overlapping interval detected
    """
    # Verify doctor exists
    _get_doctor_or_404(session=session, doctor_id=doctor_id)

    # Check permissions
    _check_doctor_access(current_user=current_user, doctor_id=doctor_id)

    try:
        availability = crud.create_doctor_availability(
            session=session,
            doctor_id=doctor_id,
            availability_in=availability_in,
        )
    except ValueError as exc:
        _handle_crud_error(exc)

    return availability


@router.patch(
    "/availability/{availability_id}",
    response_model=DoctorAvailabilityPublic,
    summary="Update Doctor Availability",
    description=(
        "Update an existing availability slot. "
        "Only provided fields are updated (partial update). "
        "Validates time range, duration, and overlap with other slots "
        "(excluding the slot being updated)."
    ),
)
def update_doctor_availability(
    availability_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    availability_in: DoctorAvailabilityUpdate,
) -> Any:
    """
    Update an existing availability slot.

    Parameters:
    - **availability_id**: UUID of the availability slot to update
    - **Request body**: Fields to update (all optional)

    Returns:
    - The updated availability slot.

    Errors:
    - **404**: Availability not found
    - **400**: Invalid time range or duration
    - **409**: Overlapping interval detected
    """
    # Get the availability record
    db_availability = _get_availability_or_404(
        session=session, availability_id=availability_id
    )

    # Check permissions
    _check_availability_ownership(
        current_user=current_user, availability=db_availability
    )

    try:
        availability = crud.update_doctor_availability(
            session=session,
            db_availability=db_availability,
            availability_in=availability_in,
        )
    except ValueError as exc:
        _handle_crud_error(exc)

    return availability


@router.delete(
    "/availability/{availability_id}",
    response_model=Message,
    summary="Delete Doctor Availability",
    description=(
        "Delete an availability slot. "
        "This permanently removes the record from the database."
    ),
)
def delete_doctor_availability(
    availability_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """
    Delete an availability slot.

    Parameters:
    - **availability_id**: UUID of the availability slot to delete

    Returns:
    - Confirmation message.

    Errors:
    - **404**: Availability not found
    - **403**: Insufficient permissions
    """
    # Get the availability record
    db_availability = _get_availability_or_404(
        session=session, availability_id=availability_id
    )

    # Check permissions
    _check_availability_ownership(
        current_user=current_user, availability=db_availability
    )

    crud.delete_doctor_availability(session=session, db_availability=db_availability)
    return Message(message="Availability deleted successfully")
