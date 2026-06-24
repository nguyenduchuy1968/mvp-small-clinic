import uuid
from typing import Any

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    BlockedDateCreate,
    BlockedDatePublic,
    BlockedDatesPublic,
    Doctor,
    Message,
    User,
    UserRole,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(tags=["blocked_dates"])


def _get_doctor_or_404(*, session: SessionDep, doctor_id: uuid.UUID) -> Doctor:
    """Get a doctor by ID or raise 404."""
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor


def _check_doctor_access(*, current_user: User, doctor_id: uuid.UUID) -> None:
    """Check if the current user can access the given doctor's blocked dates.

    Admins can access any doctor. Doctors can only access their own data.
    """
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return
    # Doctor must be accessing their own blocked dates
    if current_user.doctor is None or current_user.doctor.id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )


@router.get(
    "/doctors/{doctor_id}/blocked-dates",
    response_model=BlockedDatesPublic,
)
def read_blocked_dates(
    doctor_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get blocked dates for a doctor.

    Returns blocked dates ordered by date ascending with pagination.
    """
    _get_doctor_or_404(session=session, doctor_id=doctor_id)
    _check_doctor_access(current_user=current_user, doctor_id=doctor_id)

    records, total = crud.get_blocked_dates(
        session=session,
        doctor_id=doctor_id,
        skip=skip,
        limit=limit,
    )
    return BlockedDatesPublic(data=records, count=total)


@router.post(
    "/doctors/{doctor_id}/blocked-dates",
    response_model=BlockedDatesPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_blocked_dates(
    doctor_id: uuid.UUID,
    blocked_dates_in: BlockedDateCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Create blocked dates for a doctor.

    Accepts a list of dates and an optional reason.
    Creates one row per date.
    Validates that dates are not in the past and not already blocked.
    """
    _get_doctor_or_404(session=session, doctor_id=doctor_id)
    _check_doctor_access(current_user=current_user, doctor_id=doctor_id)

    try:
        result = crud.create_blocked_dates(
            session=session,
            doctor_id=doctor_id,
            blocked_dates_in=blocked_dates_in,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
    return result


@router.delete(
    "/doctors/{doctor_id}/blocked-dates/{blocked_date_id}",
    response_model=Message,
)
def delete_blocked_date(
    doctor_id: uuid.UUID,
    blocked_date_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """Delete a blocked date record."""
    _get_doctor_or_404(session=session, doctor_id=doctor_id)
    _check_doctor_access(current_user=current_user, doctor_id=doctor_id)

    try:
        crud.delete_blocked_date(
            session=session,
            blocked_date_id=blocked_date_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    return Message(message="Blocked date deleted successfully")
