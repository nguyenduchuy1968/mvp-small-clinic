"""CRUD tests for Blocked Dates.

Tests the CRUD layer directly (no API).
Verifies business validation logic for creating, reading, and deleting blocked dates.
"""

import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from app import crud
from app.core.config import settings
from app.models import (
    BlockedDate,
    BlockedDateCreate,
    Doctor,
    User,
    UserCreate,
    UserRole,
)
from sqlmodel import Session, select
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


def _future_date(days_ahead: int = 30) -> date:
    """Return a date in the future (clinic local timezone)."""
    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    today_local = datetime.now(clinic_tz).date()
    return today_local + timedelta(days=days_ahead)


def _past_date() -> date:
    """Return a date in the past."""
    return date(2020, 1, 1)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


class TestCreateBlockedDates:
    def test_create_single_date(self, db: Session) -> None:
        """Creating a single blocked date should succeed."""
        _, doctor = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason="Clinic closed")
        result = crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        assert len(result.data) == 1
        assert result.data[0].blocked_date == future
        assert result.data[0].reason == "Clinic closed"
        assert result.data[0].id is not None
        assert result.data[0].created_at is not None

    def test_create_multiple_dates(self, db: Session) -> None:
        """Creating multiple blocked dates should succeed."""
        _, doctor = _create_doctor_user(db)
        future1 = _future_date(10)
        future2 = _future_date(11)
        future3 = _future_date(12)

        blocked_in = BlockedDateCreate(
            dates=[future1, future2, future3],
            reason="Vacation",
        )
        result = crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        assert len(result.data) == 3
        dates = [r.blocked_date for r in result.data]
        assert future1 in dates
        assert future2 in dates
        assert future3 in dates
        for r in result.data:
            assert r.reason == "Vacation"

    def test_create_without_reason(self, db: Session) -> None:
        """Creating a blocked date without a reason should succeed (reason is optional)."""
        _, doctor = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason=None)
        result = crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        assert len(result.data) == 1
        assert result.data[0].reason is None

    def test_create_past_date_raises(self, db: Session) -> None:
        """Creating a blocked date in the past should raise ValueError."""
        _, doctor = _create_doctor_user(db)
        past = _past_date()

        blocked_in = BlockedDateCreate(dates=[past], reason="Test")
        with pytest.raises(ValueError, match="Cannot block past date"):
            crud.create_blocked_dates(
                session=db,
                doctor_id=doctor.id,
                blocked_dates_in=blocked_in,
            )

    def test_create_duplicate_date_raises(self, db: Session) -> None:
        """Creating a duplicate blocked date should raise ValueError."""
        _, doctor = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason="First block")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        # Try to block the same date again
        blocked_in2 = BlockedDateCreate(dates=[future], reason="Second block")
        with pytest.raises(ValueError, match="already blocked"):
            crud.create_blocked_dates(
                session=db,
                doctor_id=doctor.id,
                blocked_dates_in=blocked_in2,
            )

    def test_create_different_doctors_same_date(self, db: Session) -> None:
        """Two different doctors should be able to block the same date."""
        _, doctor1 = _create_doctor_user(db)
        _, doctor2 = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason="Doctor 1 off")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor1.id,
            blocked_dates_in=blocked_in,
        )

        blocked_in2 = BlockedDateCreate(dates=[future], reason="Doctor 2 off")
        # Should not raise — different doctor
        result = crud.create_blocked_dates(
            session=db,
            doctor_id=doctor2.id,
            blocked_dates_in=blocked_in2,
        )
        assert len(result.data) == 1
        assert result.data[0].blocked_date == future


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


class TestGetBlockedDates:
    def test_get_empty(self, db: Session) -> None:
        """Getting blocked dates for a doctor with none should return empty."""
        _, doctor = _create_doctor_user(db)

        records, total = crud.get_blocked_dates(
            session=db,
            doctor_id=doctor.id,
        )

        assert total == 0
        assert len(records) == 0

    def test_get_multiple_ordered_by_date(self, db: Session) -> None:
        """Blocked dates should be returned ordered by date ascending."""
        _, doctor = _create_doctor_user(db)
        future1 = _future_date(10)
        future2 = _future_date(5)  # Earlier date
        future3 = _future_date(15)

        blocked_in = BlockedDateCreate(
            dates=[future1, future2, future3],
            reason="Test",
        )
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        records, total = crud.get_blocked_dates(
            session=db,
            doctor_id=doctor.id,
        )

        assert total == 3
        assert len(records) == 3
        # Should be ordered by date ascending
        assert records[0].blocked_date == future2
        assert records[1].blocked_date == future1
        assert records[2].blocked_date == future3

    def test_get_with_pagination(self, db: Session) -> None:
        """Pagination should work correctly."""
        _, doctor = _create_doctor_user(db)
        dates = [_future_date(i) for i in range(1, 6)]

        blocked_in = BlockedDateCreate(dates=dates, reason="Test")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        # Get first 2
        records, total = crud.get_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            skip=0,
            limit=2,
        )
        assert total == 5
        assert len(records) == 2

        # Get next 2
        records2, total2 = crud.get_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            skip=2,
            limit=2,
        )
        assert total2 == 5
        assert len(records2) == 2
        # Ensure no overlap
        ids1 = {r.id for r in records}
        ids2 = {r.id for r in records2}
        assert ids1.isdisjoint(ids2)

    def test_get_other_doctor_not_included(self, db: Session) -> None:
        """Blocked dates for one doctor should not appear for another."""
        _, doctor1 = _create_doctor_user(db)
        _, doctor2 = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason="Doctor 1 off")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor1.id,
            blocked_dates_in=blocked_in,
        )

        records, total = crud.get_blocked_dates(
            session=db,
            doctor_id=doctor2.id,
        )
        assert total == 0
        assert len(records) == 0


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


class TestDeleteBlockedDate:
    def test_delete_success(self, db: Session) -> None:
        """Deleting an existing blocked date should succeed."""
        _, doctor = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason="Test")
        result = crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )
        blocked_id = result.data[0].id

        # Delete it
        crud.delete_blocked_date(session=db, blocked_date_id=blocked_id)

        # Verify it's gone
        records, total = crud.get_blocked_dates(
            session=db,
            doctor_id=doctor.id,
        )
        assert total == 0

    def test_delete_nonexistent_raises(self, db: Session) -> None:
        """Deleting a non-existent blocked date should raise ValueError."""
        fake_id = uuid.uuid4()
        with pytest.raises(ValueError, match="not found"):
            crud.delete_blocked_date(session=db, blocked_date_id=fake_id)


# ---------------------------------------------------------------------------
# Validation: _validate_not_blocked_date
# ---------------------------------------------------------------------------


class TestValidateNotBlockedDate:
    def test_not_blocked_passes(self, db: Session) -> None:
        """A date that is not blocked should pass validation."""
        _, doctor = _create_doctor_user(db)
        future = _future_date(10)

        # Should not raise
        crud._validate_not_blocked_date(
            session=db,
            doctor_id=doctor.id,
            appointment_date=future,
        )

    def test_blocked_raises(self, db: Session) -> None:
        """A date that is blocked should raise ValueError."""
        _, doctor = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason="Clinic closed")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        with pytest.raises(ValueError, match="has blocked date"):
            crud._validate_not_blocked_date(
                session=db,
                doctor_id=doctor.id,
                appointment_date=future,
            )

    def test_other_doctor_not_blocked(self, db: Session) -> None:
        """A date blocked for one doctor should not affect another doctor."""
        _, doctor1 = _create_doctor_user(db)
        _, doctor2 = _create_doctor_user(db)
        future = _future_date(10)

        blocked_in = BlockedDateCreate(dates=[future], reason="Doctor 1 off")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor1.id,
            blocked_dates_in=blocked_in,
        )

        # Doctor 2 should still be able to book on this date
        crud._validate_not_blocked_date(
            session=db,
            doctor_id=doctor2.id,
            appointment_date=future,
        )


# ---------------------------------------------------------------------------
# Integration: create_appointment with blocked date
# ---------------------------------------------------------------------------


class TestCreateAppointmentWithBlockedDate:
    def test_appointment_on_blocked_date_rejected(self, db: Session) -> None:
        """Creating an appointment on a blocked date should raise ValueError."""
        _, doctor = _create_doctor_user(db)
        future = _future_date(30)

        # Block the date
        blocked_in = BlockedDateCreate(dates=[future], reason="Vacation")
        crud.create_blocked_dates(
            session=db,
            doctor_id=doctor.id,
            blocked_dates_in=blocked_in,
        )

        # Try to create an appointment — should fail at step 2.5
        from app.models import AppointmentCreate, ContactMethod

        appointment_in = AppointmentCreate(
            doctor_id=doctor.id,
            patient_name="Test Patient",
            patient_phone="+84912345678",
            patient_email="test@example.com",
            contact_method=ContactMethod.PHONE,
            appointment_date=future,
            appointment_time="10:00",
        )

        with pytest.raises(ValueError, match="has blocked date"):
            crud.create_appointment(
                session=db,
                appointment_in=appointment_in,
            )
