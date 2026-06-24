"""Slot Generator service.

Generates available booking slots for a doctor on a given date based on
their active availability intervals. This is the single source of truth
for which times are bookable — appointments may only be created using
generated slots.

Uses the same slot alignment logic as the CRUD validation layer
(offset_minutes % duration_minutes == 0) to ensure consistency.

All time comparisons use the clinic's configured timezone
(settings.CLINIC_TIMEZONE) rather than UTC, ensuring that slot
availability correctly reflects the local date/time at the clinic.
"""

import uuid
from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.crud import _format_time, _time_to_minutes
from app.models import (
    Appointment,
    AppointmentStatus,
    AvailableSlot,
    AvailableSlotsResponse,
    BlockedDate,
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
    5. Filter slots based on clinic local time (settings.CLINIC_TIMEZONE):
       - Past date (target_date < today_local): return empty.
       - Today (target_date == today_local): remove past slots.
       - Future date (target_date > today_local): all slots valid.
    6. Sort remaining slots ascending.
    7. If no slots remain, set a reason:
       'weekend', 'no_schedule', 'doctor_unavailable', or 'fully_booked'.

    All date/time comparisons use the clinic's configured timezone, not the
    user's browser timezone. This ensures identical behavior for users in
    any geographic location.

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

    # 1.5 Check if the date is blocked for this doctor
    blocked_statement = select(BlockedDate).where(
        BlockedDate.doctor_id == doctor_id,
        BlockedDate.blocked_date == target_date,
    )
    blocked = session.exec(blocked_statement).first()
    if blocked is not None:
        return AvailableSlotsResponse(
            doctor_id=doctor_id,
            date=target_date,
            slots=[],
            count=0,
            reason="doctor_unavailable",
        )

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

    # 5. Filter slots based on clinic local time
    #    Uses clinic local timezone (settings.CLINIC_TIMEZONE) so that slot
    #    times stored in local time are correctly compared against the current
    #    local time at the clinic. This is the single source of truth for
    #    date/time comparisons — the frontend's browser timezone is irrelevant.
    #
    #    Three cases:
    #      Case 1 — target_date < today_local:  Past date → return empty
    #      Case 2 — target_date == today_local: Today → filter past slots
    #      Case 3 — target_date > today_local:  Future date → all slots valid
    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    now_local = datetime.now(clinic_tz)
    today_local = now_local.date()

    if target_date < today_local:
        # Case 1: Past date — no slots can be booked
        available = []
    elif target_date == today_local:
        # Case 2: Today — remove slots that have already passed
        current_minutes = now_local.hour * 60 + now_local.minute
        available = [t for t in available if _time_to_minutes(t) > current_minutes]
    # Case 3: Future date — all slots remain valid (no filtering needed)

    # 6. Build response
    slot_objects = [AvailableSlot(time=t) for t in available]

    # 7. Determine reason when no slots are available
    reason: str | None = None
    if len(slot_objects) == 0:
        weekday_number = target_date.weekday()  # Monday=0, Sunday=6
        if weekday_number >= 5:  # Saturday=5, Sunday=6
            reason = "weekend"
        elif not intervals:
            # No active intervals — check if any schedule records exist at all
            # for this weekday (even inactive ones)
            any_schedule_statement = select(DoctorAvailability).where(
                DoctorAvailability.doctor_id == doctor_id,
                DoctorAvailability.weekday == weekday,
            )
            any_schedules = session.exec(any_schedule_statement).all()
            if any_schedules:
                # Schedule records exist but all are inactive
                reason = "doctor_unavailable"
            else:
                reason = "no_schedule"
        else:
            reason = "fully_booked"

    return AvailableSlotsResponse(
        doctor_id=doctor_id,
        date=target_date,
        slots=slot_objects,
        count=len(slot_objects),
        reason=reason,
    )
