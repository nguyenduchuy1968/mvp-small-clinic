"""CRUD tests for the Slot Generator service.

Tests the slot generation logic directly (no API).
Verifies slot alignment, booking removal, past-time filtering, and ordering.

All time comparisons use the clinic's configured timezone
(settings.CLINIC_TIMEZONE) rather than UTC, ensuring that slot
availability correctly reflects the local date/time at the clinic.
"""

import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.config import settings

import pytest
from app import crud, slot_generator
from app.models import (
    Appointment,
    AppointmentCreate,
    AppointmentStatus,
    AppointmentStatusUpdate,
    AvailableSlot,
    AvailableSlotsResponse,
    BlockedDateCreate,
    ContactMethod,
    Doctor,
    DoctorAvailability,
    User,
    UserCreate,
    UserRole,
    Weekday,
)
from sqlmodel import Session
from tests.utils.utils import random_email, random_lower_string

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_doctor_user(db: Session) -> tuple[User, Doctor]:
    """Create a user with role=DOCTOR and a linked Doctor profile."""
    email = random_email()
    password = random_lower_string()
    user_in = UserCreate(email=email, password=password, role=UserRole.DOCTOR)
    user = crud.create_user(session=db, user_create=user_in)
    assert user.id is not None

    doctor = Doctor(
        user_id=user.id,
        full_name="Test Doctor",
        specialty="Cardiology",
        is_active=True,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return user, doctor


def _create_availability(
    db: Session,
    doctor_id: uuid.UUID,
    weekday: Weekday = Weekday.MONDAY,
    start_time: str = "09:00",
    end_time: str = "12:00",
    duration_minutes: int = 30,
    is_active: bool = True,
) -> DoctorAvailability:
    """Helper to create an availability record via CRUD."""
    from app.models import DoctorAvailabilityCreate

    availability_in = DoctorAvailabilityCreate(
        weekday=weekday,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=duration_minutes,
        is_active=is_active,
    )
    return crud.create_doctor_availability(
        session=db,
        doctor_id=doctor_id,
        availability_in=availability_in,
    )


def _get_future_monday() -> date:
    """Return the date of next Monday (or today if it's Monday)."""
    today = date.today()
    days_ahead = 0 - today.weekday()  # Monday=0
    if days_ahead <= 0:  # Today is Monday or already past Monday this week
        days_ahead += 7
    return today + timedelta(days=days_ahead)


def _get_future_tuesday() -> date:
    """Return the date of next Tuesday."""
    monday = _get_future_monday()
    return monday + timedelta(days=1)


# ---------------------------------------------------------------------------
# _generate_slots_for_interval
# ---------------------------------------------------------------------------


class TestGenerateSlotsForInterval:
    """Unit tests for the internal _generate_slots_for_interval function."""

    def test_single_interval_30min_slots(self) -> None:
        """30-min slots from 09:00 to 12:00 → 6 slots."""
        slots = slot_generator._generate_slots_for_interval(
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        assert slots == [
            "09:00",
            "09:30",
            "10:00",
            "10:30",
            "11:00",
            "11:30",
        ]

    def test_single_interval_15min_slots(self) -> None:
        """15-min slots from 09:00 to 10:00 → 4 slots."""
        slots = slot_generator._generate_slots_for_interval(
            start_time="09:00",
            end_time="10:00",
            duration_minutes=15,
        )
        assert slots == ["09:00", "09:15", "09:30", "09:45"]

    def test_single_interval_60min_slots(self) -> None:
        """60-min slots from 08:00 to 12:00 → 4 slots."""
        slots = slot_generator._generate_slots_for_interval(
            start_time="08:00",
            end_time="12:00",
            duration_minutes=60,
        )
        assert slots == ["08:00", "09:00", "10:00", "11:00"]

    def test_single_interval_exact_boundary(self) -> None:
        """End time is exclusive — slot at end_time is NOT generated."""
        slots = slot_generator._generate_slots_for_interval(
            start_time="09:00",
            end_time="09:30",
            duration_minutes=30,
        )
        assert slots == ["09:00"]

    def test_single_interval_zero_duration_gap(self) -> None:
        """Start == end → no slots."""
        slots = slot_generator._generate_slots_for_interval(
            start_time="09:00",
            end_time="09:00",
            duration_minutes=30,
        )
        assert slots == []

    def test_slot_alignment_matches_crud(self) -> None:
        """Verify generated slots pass CRUD validation (single source of truth)."""
        slots = slot_generator._generate_slots_for_interval(
            start_time="09:00",
            end_time="17:00",
            duration_minutes=30,
        )
        # All generated slots should be valid slot-aligned times
        for slot_time in slots:
            parts = slot_time.split(":")
            minutes = int(parts[0]) * 60 + int(parts[1])
            offset = minutes - 540  # 09:00 = 540 minutes
            assert offset % 30 == 0, f"{slot_time} is not slot-aligned"


# ---------------------------------------------------------------------------
# generate_available_slots — Single Interval
# ---------------------------------------------------------------------------


class TestSingleInterval:
    """Single availability interval, no bookings."""

    def test_generates_correct_slots(self, db: Session) -> None:
        """Single interval 09:00-12:00, 30-min slots → 6 slots."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        assert isinstance(result, AvailableSlotsResponse)
        assert result.doctor_id == doctor.id
        assert result.date == target_date
        assert result.count == 6
        times = [s.time for s in result.slots]
        assert times == ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]

    def test_different_duration(self, db: Session) -> None:
        """Single interval 09:00-12:00, 60-min slots → 3 slots."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=60,
        )
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        assert result.count == 3
        times = [s.time for s in result.slots]
        assert times == ["09:00", "10:00", "11:00"]


# ---------------------------------------------------------------------------
# generate_available_slots — Multiple Intervals
# ---------------------------------------------------------------------------


class TestMultipleIntervals:
    """Multiple availability intervals on the same day."""

    def test_two_intervals(self, db: Session) -> None:
        """Morning 09:00-12:00 + afternoon 13:00-17:00, 30-min slots."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="13:00",
            end_time="17:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        # Morning: 6 slots, Afternoon: 8 slots → Total: 14
        assert result.count == 14
        times = [s.time for s in result.slots]
        assert "09:00" in times
        assert "11:30" in times
        assert "13:00" in times
        assert "16:30" in times
        # Verify ordering
        assert times == sorted(times)

    def test_intervals_with_different_durations(self, db: Session) -> None:
        """Morning 30-min slots, afternoon 60-min slots."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="13:00",
            end_time="17:00",
            duration_minutes=60,
        )
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        # Morning: 6 slots (30-min), Afternoon: 4 slots (60-min) → Total: 10
        assert result.count == 10
        times = [s.time for s in result.slots]
        assert times == [
            "09:00",
            "09:30",
            "10:00",
            "10:30",
            "11:00",
            "11:30",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
        ]


# ---------------------------------------------------------------------------
# generate_available_slots — Booked Slots Removed
# ---------------------------------------------------------------------------


class TestBookedSlotsRemoved:
    """Booked slots (PENDING/CONFIRMED) are excluded from results."""

    def test_pending_slot_removed(self, db: Session) -> None:
        """A PENDING appointment blocks its slot."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # Create a PENDING appointment at 10:00
        appointment_in = AppointmentCreate(
            doctor_id=doctor.id,
            patient_name="Test Patient",
            patient_phone="+84912345678",
            contact_method=ContactMethod.PHONE,
            appointment_date=target_date,
            appointment_time="10:00",
        )
        crud.create_appointment(session=db, appointment_in=appointment_in)

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        # 6 slots - 1 booked = 5
        assert result.count == 5
        times = [s.time for s in result.slots]
        assert "10:00" not in times
        assert "09:00" in times
        assert "11:30" in times

    def test_confirmed_slot_removed(self, db: Session) -> None:
        """A CONFIRMED appointment blocks its slot.

        With AUTO_CONFIRM_APPOINTMENTS=True, new appointments are created
        directly as CONFIRMED, so no explicit status update is needed.
        """
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # Create an appointment — auto-confirmed as CONFIRMED
        appointment_in = AppointmentCreate(
            doctor_id=doctor.id,
            patient_name="Test Patient",
            patient_phone="+84912345678",
            contact_method=ContactMethod.PHONE,
            appointment_date=target_date,
            appointment_time="10:00",
        )
        crud.create_appointment(session=db, appointment_in=appointment_in)

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        assert result.count == 5
        times = [s.time for s in result.slots]
        assert "10:00" not in times

    def test_cancelled_slot_not_removed(self, db: Session) -> None:
        """A CANCELLED appointment does NOT block its slot."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # Create a PENDING appointment, then cancel it
        appointment_in = AppointmentCreate(
            doctor_id=doctor.id,
            patient_name="Test Patient",
            patient_phone="+84912345678",
            contact_method=ContactMethod.PHONE,
            appointment_date=target_date,
            appointment_time="10:00",
        )
        appointment_public = crud.create_appointment(
            session=db, appointment_in=appointment_in
        )
        # Fetch the ORM model from the database for status update
        db_appointment = db.get(Appointment, appointment_public.id)
        crud.update_appointment_status(
            session=db,
            db_appointment=db_appointment,
            status_update=AppointmentStatusUpdate(status=AppointmentStatus.CANCELLED),
        )

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        # CANCELLED doesn't block → all 6 slots available
        assert result.count == 6
        times = [s.time for s in result.slots]
        assert "10:00" in times

    def test_multiple_booked_slots_removed(self, db: Session) -> None:
        """Multiple booked slots are all removed."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # Book 3 slots: 09:00, 10:00, 11:00
        for time_str in ["09:00", "10:00", "11:00"]:
            appointment_in = AppointmentCreate(
                doctor_id=doctor.id,
                patient_name="Test Patient",
                patient_phone="+84912345678",
                contact_method=ContactMethod.PHONE,
                appointment_date=target_date,
                appointment_time=time_str,
            )
            crud.create_appointment(session=db, appointment_in=appointment_in)

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        # 6 slots - 3 booked = 3
        assert result.count == 3
        times = [s.time for s in result.slots]
        assert times == ["09:30", "10:30", "11:30"]


# ---------------------------------------------------------------------------
# generate_available_slots — Empty / Inactive Availability
# ---------------------------------------------------------------------------


class TestEmptyAvailability:
    """Edge cases: no availability or inactive availability."""

    def test_no_availability_records(self, db: Session) -> None:
        """Doctor has no availability records → empty result."""
        _, doctor = _create_doctor_user(db)
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        assert result.count == 0
        assert result.slots == []

    def test_inactive_availability(self, db: Session) -> None:
        """Doctor has only inactive availability → empty result."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
            is_active=False,
        )
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        assert result.count == 0
        assert result.slots == []

    def test_wrong_weekday(self, db: Session) -> None:
        """Availability is for Tuesday, requesting Monday → empty result."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.TUESDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()  # Monday

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        assert result.count == 0
        assert result.slots == []


# ---------------------------------------------------------------------------
# generate_available_slots — Ordering
# ---------------------------------------------------------------------------


class TestOrdering:
    """Slots must be returned in ascending time order."""

    def test_slots_are_sorted(self, db: Session) -> None:
        """Slots from multiple intervals are sorted ascending."""
        _, doctor = _create_doctor_user(db)
        # Add intervals in reverse order to test sorting
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="13:00",
            end_time="15:00",
            duration_minutes=30,
        )
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        times = [s.time for s in result.slots]
        assert times == sorted(times)
        # Verify specific ordering
        assert times == [
            "09:00",
            "09:30",
            "10:00",
            "10:30",
            "11:00",
            "11:30",
            "13:00",
            "13:30",
            "14:00",
            "14:30",
        ]


# ---------------------------------------------------------------------------
# generate_available_slots — Past Time Filtering (today)
# ---------------------------------------------------------------------------


class TestPastTimeFiltering:
    """When target_date is today, past slots must be excluded.

    All time comparisons use the clinic's configured timezone
    (settings.CLINIC_TIMEZONE) rather than UTC, ensuring that slot
    availability correctly reflects the local date/time at the clinic.
    """

    def test_past_slots_excluded_for_today(self, db: Session) -> None:
        """If target_date is today, slots before now are excluded.

        Uses clinic local timezone (settings.CLINIC_TIMEZONE) for the
        comparison, not UTC. This ensures that slot times stored in local
        time are correctly evaluated against the current local time.
        """
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday(date.today().strftime("%A").lower()),
            start_time="00:00",
            end_time="23:59",
            duration_minutes=60,
        )

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=date.today(),
        )

        # All returned slots should be in the future (clinic local time)
        clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
        now_local = datetime.now(clinic_tz)
        current_minutes = now_local.hour * 60 + now_local.minute
        for slot in result.slots:
            parts = slot.time.split(":")
            slot_minutes = int(parts[0]) * 60 + int(parts[1])
            assert (
                slot_minutes > current_minutes
            ), f"Slot {slot.time} is in the past but was returned"

    def test_future_slot_today_included(self, db: Session) -> None:
        """If target_date is today, slots after now are included.

        Verifies that future slots for today are still returned when
        using clinic local timezone.
        """
        _, doctor = _create_doctor_user(db)
        clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
        now_local = datetime.now(clinic_tz)
        # Create availability for a future time slot today
        future_hour = (now_local.hour + 2) % 24
        future_start = f"{future_hour:02d}:00"
        future_end = f"{(future_hour + 1) % 24:02d}:00"

        _create_availability(
            db,
            doctor.id,
            weekday=Weekday(now_local.strftime("%A").lower()),
            start_time=future_start,
            end_time=future_end,
            duration_minutes=30,
        )

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=now_local.date(),
        )

        # Future slots for today should be returned
        assert result.count > 0, "Future slots for today should be returned"
        for slot in result.slots:
            parts = slot.time.split(":")
            slot_minutes = int(parts[0]) * 60 + int(parts[1])
            assert (
                slot_minutes > now_local.hour * 60 + now_local.minute
            ), f"Slot {slot.time} is in the past but was returned"

    def test_tomorrow_all_slots_included(self, db: Session) -> None:
        """If target_date is tomorrow, all valid slots are included regardless of time.

        No past-slot filtering should apply for future dates.
        """
        _, doctor = _create_doctor_user(db)
        clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
        now_local = datetime.now(clinic_tz)
        tomorrow = now_local.date() + timedelta(days=1)

        _create_availability(
            db,
            doctor.id,
            weekday=Weekday(tomorrow.strftime("%A").lower()),
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=tomorrow,
        )

        # All 6 slots should be available (future date, no time filtering)
        assert result.count == 6, (
            f"Expected 6 slots for tomorrow, got {result.count}. "
            f"Tomorrow is {tomorrow} ({tomorrow.strftime('%A')})"
        )

    def test_future_date_all_slots_included(self, db: Session) -> None:
        """If target_date is in the future, all slots are included."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        # All 6 slots should be available (future date)
        assert result.count == 6

    def test_past_date_returns_empty_slots(self, db: Session) -> None:
        """If target_date is before today (clinic local time), return empty.

        Case 1: target_date < today_local → no slots should ever be returned
        for a date that is already in the past according to the clinic's
        local timezone. This prevents users in different timezones from
        booking slots on a date that is still 'today' for them but already
        'yesterday' at the clinic.
        """
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )

        # Use a date guaranteed to be in the past (clinic local time)
        clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
        now_local = datetime.now(clinic_tz)
        yesterday = now_local.date() - timedelta(days=1)

        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=yesterday,
        )

        # Past date must return empty slots
        assert result.count == 0, (
            f"Expected 0 slots for past date {yesterday}, "
            f"got {result.count}: {[s.time for s in result.slots]}"
        )
        assert result.slots == [], (
            f"Expected empty slots list for past date {yesterday}"
        )


# ---------------------------------------------------------------------------
# Integration: Slot Generator + CRUD Single Source of Truth
# ---------------------------------------------------------------------------


class TestSingleSourceOfTruth:
    """Generated slots must pass CRUD validation, and vice versa."""

    def test_generated_slots_pass_crud_validation(self, db: Session) -> None:
        """Every generated slot should be accepted by create_appointment."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # Generate slots
        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        # Each generated slot should be creatable
        for slot in result.slots:
            appointment_in = AppointmentCreate(
                doctor_id=doctor.id,
                patient_name="Integration Test",
                patient_phone="+84912345678",
                contact_method=ContactMethod.PHONE,
                appointment_date=target_date,
                appointment_time=slot.time,
            )
            appointment = crud.create_appointment(
                session=db, appointment_in=appointment_in
            )
            assert appointment is not None
            assert appointment.appointment_time == slot.time

    def test_non_aligned_time_rejected_by_crud(self, db: Session) -> None:
        """A time not on a slot boundary is rejected by CRUD."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # A non-aligned time should be rejected
        with pytest.raises(ValueError, match="does not align with"):
            appointment_in = AppointmentCreate(
                doctor_id=doctor.id,
                patient_name="Test Patient",
                patient_phone="+84912345678",
                contact_method=ContactMethod.PHONE,
                appointment_date=target_date,
                appointment_time="09:05",  # Not slot-aligned
            )
            crud.create_appointment(session=db, appointment_in=appointment_in)


# ---------------------------------------------------------------------------
# Blocked Dates
# ---------------------------------------------------------------------------


class TestSlotGeneratorWithBlockedDates:
    def test_blocked_date_returns_empty_with_reason(self, db: Session) -> None:
        """A blocked date should return no slots with reason='doctor_unavailable'."""
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # Block the date
        blocked_in = BlockedDateCreate(dates=[target_date], reason="Vacation")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        # Generate slots — should be empty with reason
        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor.id,
            target_date=target_date,
        )

        assert result.count == 0
        assert len(result.slots) == 0
        assert result.reason == "doctor_unavailable"

    def test_blocked_date_other_doctor_unaffected(self, db: Session) -> None:
        """Blocking a date for one doctor should not affect another doctor's slots."""
        _, doctor1 = _create_doctor_user(db)
        _, doctor2 = _create_doctor_user(db)
        _create_availability(
            db,
            doctor1.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        _create_availability(
            db,
            doctor2.id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
            duration_minutes=30,
        )
        target_date = _get_future_monday()

        # Block date for doctor1 only
        blocked_in = BlockedDateCreate(dates=[target_date], reason="Vacation")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor1.id,
            blocked_dates_in=blocked_in,
        )

        # Doctor 2 should still have slots
        result = slot_generator.generate_available_slots(
            session=db,
            doctor_id=doctor2.id,
            target_date=target_date,
        )

        assert result.count > 0
        assert result.reason is None
