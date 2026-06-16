"""Slot Generator service.

Generates available booking slots for a doctor on a given date based on
their active availability intervals. This is the single source of truth
for which times are bookable — appointments may only be created using
generated slots.

Uses the same slot alignment logic as the CRUD validation layer
(offset_minutes % duration_minutes == 0) to ensure consistency.
"""

import uuid
from datetime import date, datetime, timezone

from app.crud import _format_time, _time_to_minutes
from app.models import (
    Appointment,
    AppointmentStatus,
    AvailableSlot,
    AvailableSlotsResponse,
    DoctorAvailability,
    Weekday,
)
from sqlmodel import Session, select


def _generate_slots_for_interval(
    start_time: str,
    end_time: str,
    duration_minutes: int,
) -> list[str]:
    """Generate slot times for a single availability interval.

    Uses the same modulo-based slot alignment as CRUD validation:
    offset_minutes % duration_minutes == 0.

    Args:
        start_time: Interval start time in HH:MM format.
        end_time: Interval end time in HH:MM format.
        duration_minutes: Duration of each slot in minutes.

    Returns:
        List of slot times in HH:MM format, sorted ascending.
    """
    start_minutes = _time_to_minutes(start_time)
    end_minutes = _time_to_minutes(end_time)
    slots: list[str] = []

    current = start_minutes
    while current < end_minutes:
        slots.append(_format_time(current))
        current += duration_minutes

    return slots


def generate_available_slots(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    target_date: date,
) -> AvailableSlotsResponse:
    """Generate all available booking slots for a doctor on a given date.

    Process:
    1. Determine the weekday of target_date.
    2. Load active DoctorAvailability records for doctor_id + weekday.
    3. For each interval, generate slots using duration_minutes.
    4. Remove slots that are already booked (PENDING or CONFIRMED).
    5. If target_date is today, remove slots in the past.
    6. Sort remaining slots ascending.

    Args:
        session: SQLModel database session.
        doctor_id: UUID of the doctor.
        target_date: The date to generate slots for.

    Returns:
        AvailableSlotsResponse with sorted available slots and count.
    """
    # 1. Determine weekday
    weekday_name = target_date.strftime("%A").lower()
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

    # 2. Load active availability intervals
    statement = select(DoctorAvailability).where(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.weekday == weekday,
        DoctorAvailability.is_active == True,
    )
    intervals = session.exec(statement).all()

    # 3. Generate slots from each interval
    all_slots: list[str] = []
    for interval in intervals:
        interval_slots = _generate_slots_for_interval(
            start_time=interval.start_time,
            end_time=interval.end_time,
            duration_minutes=interval.duration_minutes,
        )
        all_slots.extend(interval_slots)

    # Remove duplicates (in case intervals overlap — though the DB
    # UniqueConstraint prevents identical intervals, different intervals
    # could theoretically overlap)
    all_slots = sorted(set(all_slots))

    # 4. Remove booked slots (PENDING or CONFIRMED block the slot)
    booked_statement = select(Appointment.appointment_time).where(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == target_date,
        Appointment.status.in_(
            [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
        ),
    )
    booked_times = set(session.exec(booked_statement).all())
    available = [t for t in all_slots if t not in booked_times]

    # 5. If target_date is today, remove past slots
    today_utc = datetime.now(timezone.utc).date()
    if target_date == today_utc:
        now = datetime.now(timezone.utc)
        current_minutes = now.hour * 60 + now.minute
        available = [t for t in available if _time_to_minutes(t) > current_minutes]

    # 6. Build response
    slot_objects = [AvailableSlot(time=t) for t in available]
    return AvailableSlotsResponse(
        doctor_id=doctor_id,
        date=target_date,
        slots=slot_objects,
        count=len(slot_objects),
    )
