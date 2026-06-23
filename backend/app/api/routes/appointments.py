"""Appointment API routes.

Exposes Appointment Booking functionality through REST API.
No business logic duplication — delegates all validation to CRUD layer.
"""

import uuid
from datetime import date
from typing import Any

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.models import (
    Appointment,
    AppointmentCreate,
    AppointmentPublic,
    AppointmentsPublic,
    AppointmentStatus,
    AppointmentStatusUpdate,
    AvailableSlotsResponse,
    Doctor,
    Message,
    User,
    UserRole,
)
from app.slot_generator import generate_available_slots
from app.utils import (
    generate_booking_confirmation_email,
    generate_doctor_notification_email,
    send_email_safe,
)
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status

router = APIRouter(tags=["appointments"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_doctor_or_404(*, session: SessionDep, doctor_id: uuid.UUID) -> Doctor:
    """Get a doctor by ID or raise 404."""
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor


def _get_appointment_or_404(
    *, session: SessionDep, appointment_id: uuid.UUID
) -> Appointment:
    """Get an appointment ORM model by ID or raise 404."""
    appointment = session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    return appointment


def _check_appointment_access(*, current_user: User, appointment: Appointment) -> None:
    """Check if the current user can access the given appointment.

    Admins can access any appointment. Doctors can only access their own
    appointments (i.e., appointments where doctor_id matches their profile).
    """
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return
    # Doctor must own this appointment
    if current_user.doctor is None or current_user.doctor.id != appointment.doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )


def _check_doctor_access(*, current_user: User, doctor_id: uuid.UUID) -> None:
    """Check if the current user can access the given doctor's data.

    Admins can access any doctor. Doctors can only access their own data.
    """
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return
    # Doctor must be accessing their own data
    if current_user.doctor is None or current_user.doctor.id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )


def _handle_crud_error(exc: ValueError) -> None:
    """Convert CRUD ValueError to appropriate HTTP exception.

    Mapping:
    - "not found" → 404
    - "already booked" or "double booking" → 409
    - Everything else → 400
    """
    detail = str(exc)
    lower_detail = detail.lower()

    if "not found" in lower_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )
    if "already booked" in lower_detail or "double booking" in lower_detail:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )
    # Default to 400 for any other validation error
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail,
    )


# ---------------------------------------------------------------------------
# Public Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/doctors/{doctor_id}/slots",
    response_model=AvailableSlotsResponse,
    summary="Get Available Slots",
    description=(
        "Retrieve all available booking slots for a doctor on a specific date. "
        "Slots are generated from the doctor's active availability intervals "
        "and exclude already-booked slots (PENDING or CONFIRMED). "
        "If the requested date is today, past slots are also excluded. "
        "This endpoint is public and does not require authentication."
    ),
)
def get_available_slots(
    doctor_id: uuid.UUID,
    session: SessionDep,
    date: date = Query(
        ...,
        description="Target date in YYYY-MM-DD format",
    ),
) -> Any:
    """
    Get available booking slots for a doctor on a given date.

    Parameters:
    - **doctor_id**: UUID of the doctor
    - **date**: Target date in YYYY-MM-DD format

    Returns:
    - **doctor_id**: UUID of the doctor
    - **date**: The requested date
    - **slots**: List of available slot times (HH:MM format)
    - **count**: Number of available slots

    Errors:
    - **404**: Doctor not found
    """
    # Verify doctor exists
    _get_doctor_or_404(session=session, doctor_id=doctor_id)

    return generate_available_slots(
        session=session,
        doctor_id=doctor_id,
        target_date=date,
    )


@router.post(
    "/appointments",
    response_model=AppointmentPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create Appointment",
    description=(
        "Create a new appointment booking. "
        "Validates that the doctor exists and is active, the appointment date "
        "is not in the past, the time falls within an active availability "
        "interval and aligns with the slot duration, contact info is valid "
        "for the selected contact method, and there is no double booking. "
        "This endpoint is public and does not require authentication."
    ),
)
def create_appointment(
    session: SessionDep,
    appointment_in: AppointmentCreate,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Create a new appointment booking.

    Parameters:
    - **Request body**: Appointment details (doctor_id, patient_name,
      patient_phone, patient_email, contact_method, appointment_date,
      appointment_time, notes)

    Returns:
    - The created appointment with all fields, including id and timestamps.

    Errors:
    - **404**: Doctor not found
    - **400**: Invalid appointment data (past date, invalid time, invalid contact)
    - **409**: Slot is already booked
    """
    try:
        appointment = crud.create_appointment(
            session=session,
            appointment_in=appointment_in,
        )
    except ValueError as exc:
        _handle_crud_error(exc)

    # Schedule emails via BackgroundTasks (async after HTTP response).
    # Booking creation is never rolled back due to email failure.
    if settings.emails_enabled:
        # Resolve doctor while session is still active.
        # doctor.user.email and doctor.phone are ORM traversals, but we
        # extract the string values here and pass only primitives to
        # BackgroundTasks.
        doctor = session.get(Doctor, appointment_in.doctor_id)

        # --- Patient confirmation email ---
        if appointment.patient_email:
            patient_email_data = generate_booking_confirmation_email(
                patient_name=appointment.patient_name,
                booking_number=appointment.booking_number,
                doctor_name=appointment.doctor_name,
                doctor_phone=doctor.phone if doctor else None,
                doctor_email=doctor.user.email if doctor and doctor.user else None,
                appointment_date=str(appointment.appointment_date),
                appointment_time=appointment.appointment_time,
            )
            background_tasks.add_task(
                send_email_safe,
                email_type="booking_confirmation",
                appointment_id=str(appointment.id),
                email_to=appointment.patient_email,
                subject=patient_email_data.subject,
                html_content=patient_email_data.html_content,
            )

        # --- Doctor notification email ---
        if doctor is not None and doctor.user is not None and doctor.user.email:
            doctor_email_data = generate_doctor_notification_email(
                doctor_name=appointment.doctor_name,
                patient_name=appointment.patient_name,
                patient_phone=appointment.patient_phone,
                patient_email=appointment.patient_email,
                booking_number=appointment.booking_number,
                appointment_date=str(appointment.appointment_date),
                appointment_time=appointment.appointment_time,
            )
            background_tasks.add_task(
                send_email_safe,
                email_type="doctor_notification",
                appointment_id=str(appointment.id),
                email_to=doctor.user.email,
                subject=doctor_email_data.subject,
                html_content=doctor_email_data.html_content,
            )

    return appointment


# ---------------------------------------------------------------------------
# Authenticated Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/appointments/{appointment_id}",
    response_model=AppointmentPublic,
    summary="Get Appointment by ID",
    description=(
        "Retrieve a specific appointment by its ID. "
        "Requires authentication. Admins can access any appointment. "
        "Doctors can only access their own appointments."
    ),
)
def read_appointment(
    appointment_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get a single appointment by ID.

    Parameters:
    - **appointment_id**: UUID of the appointment

    Returns:
    - The appointment with all fields.

    Errors:
    - **404**: Appointment not found
    - **403**: Insufficient permissions
    """
    db_appointment = _get_appointment_or_404(
        session=session, appointment_id=appointment_id
    )

    # Check permissions
    _check_appointment_access(current_user=current_user, appointment=db_appointment)

    return crud._appointment_to_public(db_appointment)


@router.get(
    "/appointments",
    response_model=AppointmentsPublic,
    summary="List Appointments",
    description=(
        "Retrieve a list of appointments with optional filters. "
        "Requires authentication. Admins can see all appointments. "
        "Doctors can only see their own appointments. "
        "Supports filtering by doctor_id, appointment_date, and status. "
        "Supports pagination via skip and limit parameters. "
        "Results are ordered by appointment date then time (ascending)."
    ),
)
def read_appointments(
    session: SessionDep,
    current_user: CurrentUser,
    doctor_id: uuid.UUID | None = Query(
        default=None,
        description="Filter by doctor UUID",
    ),
    appointment_date: date | None = Query(
        default=None,
        description="Filter by appointment date (YYYY-MM-DD)",
    ),
    status: AppointmentStatus | None = Query(
        default=None,
        description="Filter by appointment status",
    ),
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        default=100, ge=1, le=1000, description="Maximum records to return"
    ),
) -> Any:
    """
    List appointments with optional filters.

    Parameters:
    - **doctor_id**: Optional filter by doctor UUID
    - **appointment_date**: Optional filter by date (YYYY-MM-DD)
    - **status**: Optional filter by status (pending, confirmed, cancelled)
    - **skip**: Number of records to skip (pagination, default: 0)
    - **limit**: Maximum records to return (pagination, default: 100)

    Returns:
    - **data**: List of appointments
    - **count**: Total number of matching records

    Errors:
    - **403**: Insufficient permissions
    """
    # If user is a doctor (not admin), force filter to their own appointments
    effective_doctor_id = doctor_id
    if current_user.role != UserRole.ADMIN and not current_user.is_superuser:
        if current_user.doctor is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user doesn't have enough privileges",
            )
        # If doctor_id is specified, it must match the current user's doctor ID
        if doctor_id is not None and doctor_id != current_user.doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user doesn't have enough privileges",
            )
        effective_doctor_id = current_user.doctor.id

    records, total = crud.get_appointments(
        session=session,
        doctor_id=effective_doctor_id,
        appointment_date=appointment_date,
        status=status,
        skip=skip,
        limit=limit,
    )
    return AppointmentsPublic(data=records, count=total)


@router.patch(
    "/appointments/{appointment_id}/status",
    response_model=AppointmentPublic,
    summary="Update Appointment Status",
    description=(
        "Update the status of an appointment. "
        "Validates the status transition (e.g., PENDING→CONFIRMED, "
        "PENDING→CANCELLED, CONFIRMED→CANCELLED). "
        "Requires authentication. Admins can update any appointment. "
        "Doctors can only update their own appointments."
    ),
)
def update_appointment_status(
    appointment_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    status_update: AppointmentStatusUpdate,
) -> Any:
    """
    Update an appointment's status.

    Parameters:
    - **appointment_id**: UUID of the appointment
    - **Request body**: New status (pending, confirmed, cancelled)

    Returns:
    - The updated appointment with all fields.

    Errors:
    - **404**: Appointment not found
    - **403**: Insufficient permissions
    - **400**: Invalid status transition
    """
    db_appointment = _get_appointment_or_404(
        session=session, appointment_id=appointment_id
    )

    # Check permissions
    _check_appointment_access(current_user=current_user, appointment=db_appointment)

    try:
        appointment = crud.update_appointment_status(
            session=session,
            db_appointment=db_appointment,
            status_update=status_update,
        )
    except ValueError as exc:
        _handle_crud_error(exc)

    return appointment


@router.delete(
    "/appointments/{appointment_id}",
    response_model=Message,
    summary="Delete Appointment",
    description=(
        "Delete an appointment record. "
        "This permanently removes the record from the database. "
        "Requires authentication. Admins can delete any appointment. "
        "Doctors can only delete their own appointments."
    ),
)
def delete_appointment(
    appointment_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """
    Delete an appointment.

    Parameters:
    - **appointment_id**: UUID of the appointment to delete

    Returns:
    - Confirmation message.

    Errors:
    - **404**: Appointment not found
    - **403**: Insufficient permissions
    """
    db_appointment = _get_appointment_or_404(
        session=session, appointment_id=appointment_id
    )

    # Check permissions
    _check_appointment_access(current_user=current_user, appointment=db_appointment)

    crud.delete_appointment(session=session, db_appointment=db_appointment)
    return Message(message="Appointment deleted successfully")
