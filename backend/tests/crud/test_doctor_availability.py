"""CRUD tests for Doctor Availability.

Tests the CRUD layer directly (no API).
Verifies business validation logic.
"""

import uuid

import pytest
from app import crud
from app.models import (
    Doctor,
    DoctorAvailability,
    DoctorAvailabilityCreate,
    DoctorAvailabilityUpdate,
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


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


class TestCreateDoctorAvailability:
    def test_create_success(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(db, doctor.id)
        assert availability.id is not None
        assert availability.doctor_id == doctor.id
        assert availability.weekday == Weekday.MONDAY
        assert availability.start_time == "09:00"
        assert availability.end_time == "12:00"
        assert availability.duration_minutes == 30
        assert availability.is_active is True
        assert availability.created_at is not None
        assert availability.updated_at is not None

    def test_create_doctor_not_found(self, db: Session) -> None:
        fake_id = uuid.uuid4()
        availability_in = DoctorAvailabilityCreate(
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="12:00",
        )
        with pytest.raises(ValueError, match="not found"):
            crud.create_doctor_availability(
                session=db,
                doctor_id=fake_id,
                availability_in=availability_in,
            )

    def test_create_duplicate_interval(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id)
        with pytest.raises(Exception):  # UniqueConstraint violation
            _create_availability(db, doctor.id)

    def test_create_overlapping_interval(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id, start_time="09:00", end_time="12:00")
        with pytest.raises(ValueError, match="overlap"):
            _create_availability(db, doctor.id, start_time="10:00", end_time="14:00")

    def test_create_touching_intervals_allowed(self, db: Session) -> None:
        """Intervals that touch (09:00-12:00 and 12:00-17:00) should be allowed."""
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id, start_time="09:00", end_time="12:00")
        # Touching interval — should succeed
        _create_availability(db, doctor.id, start_time="12:00", end_time="17:00")

    def test_create_invalid_time_range_end_before_start(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        with pytest.raises(ValueError, match="end_time.*must be after start_time"):
            _create_availability(db, doctor.id, start_time="17:00", end_time="09:00")

    def test_create_invalid_time_range_equal(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        with pytest.raises(ValueError, match="end_time.*must be after start_time"):
            _create_availability(db, doctor.id, start_time="09:00", end_time="09:00")

    def test_create_duration_exceeds_interval(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        with pytest.raises(ValueError, match="duration_minutes.*cannot exceed the interval length"):
            _create_availability(
                db,
                doctor.id,
                start_time="09:00",
                end_time="10:00",
                duration_minutes=90,
            )

    def test_create_duration_equals_interval(self, db: Session) -> None:
        """duration_minutes equal to interval length should be valid."""
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(
            db,
            doctor.id,
            start_time="09:00",
            end_time="10:00",
            duration_minutes=60,
        )
        assert availability.duration_minutes == 60

    def test_create_inactive_availability(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(
            db,
            doctor.id,
            is_active=False,
        )
        assert availability.is_active is False

    def test_create_different_weekday_no_overlap(self, db: Session) -> None:
        """Same time on different weekdays should not overlap."""
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id, weekday=Weekday.MONDAY)
        _create_availability(db, doctor.id, weekday=Weekday.TUESDAY)

    def test_create_different_doctor_no_overlap(self, db: Session) -> None:
        """Same time for different doctors should not overlap."""
        _, doctor1 = _create_doctor_user(db)
        _, doctor2 = _create_doctor_user(db)
        _create_availability(db, doctor1.id)
        _create_availability(db, doctor2.id)


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


class TestReadDoctorAvailability:
    def test_get_by_id(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(db, doctor.id)
        fetched = crud.get_doctor_availability(
            session=db,
            availability_id=availability.id,
        )
        assert fetched is not None
        assert fetched.id == availability.id
        assert fetched.doctor_id == doctor.id

    def test_get_by_id_not_found(self, db: Session) -> None:
        fetched = crud.get_doctor_availability(
            session=db,
            availability_id=uuid.uuid4(),
        )
        assert fetched is None

    def test_get_availabilities_by_doctor(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id, weekday=Weekday.MONDAY)
        _create_availability(db, doctor.id, weekday=Weekday.TUESDAY)
        _create_availability(db, doctor.id, weekday=Weekday.WEDNESDAY)

        records, total = crud.get_doctor_availabilities(
            session=db,
            doctor_id=doctor.id,
        )
        assert total == 3
        assert len(records) == 3

    def test_get_availabilities_empty(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        records, total = crud.get_doctor_availabilities(
            session=db,
            doctor_id=doctor.id,
        )
        assert total == 0
        assert records == []

    def test_get_availabilities_active_only(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id, weekday=Weekday.MONDAY, is_active=True)
        _create_availability(db, doctor.id, weekday=Weekday.TUESDAY, is_active=False)

        records, total = crud.get_doctor_availabilities(
            session=db,
            doctor_id=doctor.id,
            active_only=True,
        )
        assert total == 1
        assert len(records) == 1
        assert records[0].is_active is True

    def test_get_availabilities_include_inactive(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id, weekday=Weekday.MONDAY, is_active=True)
        _create_availability(db, doctor.id, weekday=Weekday.TUESDAY, is_active=False)

        records, total = crud.get_doctor_availabilities(
            session=db,
            doctor_id=doctor.id,
            active_only=False,
        )
        assert total == 2
        assert len(records) == 2

    def test_get_availabilities_ordering(self, db: Session) -> None:
        """Verify results are ordered by weekday (calendar order) then start_time."""
        _, doctor = _create_doctor_user(db)
        # Create out of calendar order
        _create_availability(
            db, doctor.id, weekday=Weekday.FRIDAY, start_time="10:00", end_time="12:00"
        )
        _create_availability(
            db, doctor.id, weekday=Weekday.MONDAY, start_time="09:00", end_time="12:00"
        )
        _create_availability(
            db, doctor.id, weekday=Weekday.MONDAY, start_time="13:00", end_time="15:00"
        )
        _create_availability(
            db,
            doctor.id,
            weekday=Weekday.WEDNESDAY,
            start_time="09:00",
            end_time="12:00",
        )

        records, total = crud.get_doctor_availabilities(
            session=db,
            doctor_id=doctor.id,
            active_only=False,
        )
        assert total == 4

        # Expected order: MONDAY 09:00, MONDAY 13:00, WEDNESDAY 09:00, FRIDAY 10:00
        assert records[0].weekday == Weekday.MONDAY
        assert records[0].start_time == "09:00"
        assert records[1].weekday == Weekday.MONDAY
        assert records[1].start_time == "13:00"
        assert records[2].weekday == Weekday.WEDNESDAY
        assert records[2].start_time == "09:00"
        assert records[3].weekday == Weekday.FRIDAY
        assert records[3].start_time == "10:00"

    def test_get_availabilities_pagination(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        for i in range(5):
            _create_availability(
                db,
                doctor.id,
                weekday=Weekday.MONDAY,
                start_time=f"{9 + i:02d}:00",
                end_time=f"{10 + i:02d}:00",
            )

        records, total = crud.get_doctor_availabilities(
            session=db,
            doctor_id=doctor.id,
            skip=2,
            limit=2,
        )
        assert total == 5
        assert len(records) == 2


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


class TestUpdateDoctorAvailability:
    def test_update_success(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(db, doctor.id)

        update_in = DoctorAvailabilityUpdate(end_time="14:00")
        updated = crud.update_doctor_availability(
            session=db,
            db_availability=availability,
            availability_in=update_in,
        )
        assert updated.end_time == "14:00"
        assert updated.start_time == "09:00"  # unchanged
        assert updated.weekday == Weekday.MONDAY  # unchanged

    def test_update_weekday(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(db, doctor.id)

        update_in = DoctorAvailabilityUpdate(weekday=Weekday.TUESDAY)
        updated = crud.update_doctor_availability(
            session=db,
            db_availability=availability,
            availability_in=update_in,
        )
        assert updated.weekday == Weekday.TUESDAY

    def test_update_overlap_detected(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        _create_availability(
            db, doctor.id, weekday=Weekday.MONDAY, start_time="09:00", end_time="12:00"
        )
        availability2 = _create_availability(
            db, doctor.id, weekday=Weekday.MONDAY, start_time="13:00", end_time="17:00"
        )

        # Try to update second slot to overlap with first
        update_in = DoctorAvailabilityUpdate(start_time="10:00")
        with pytest.raises(ValueError, match="overlap"):
            crud.update_doctor_availability(
                session=db,
                db_availability=availability2,
                availability_in=update_in,
            )

    def test_update_no_overlap_with_self(self, db: Session) -> None:
        """Updating a slot should not detect overlap with itself."""
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(
            db, doctor.id, weekday=Weekday.MONDAY, start_time="09:00", end_time="12:00"
        )

        # Changing end_time within the same slot should not trigger overlap
        update_in = DoctorAvailabilityUpdate(end_time="11:00")
        updated = crud.update_doctor_availability(
            session=db,
            db_availability=availability,
            availability_in=update_in,
        )
        assert updated.end_time == "11:00"

    def test_update_invalid_time_range(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(db, doctor.id)

        update_in = DoctorAvailabilityUpdate(end_time="08:00")
        with pytest.raises(ValueError, match="end_time.*must be after start_time"):
            crud.update_doctor_availability(
                session=db,
                db_availability=availability,
                availability_in=update_in,
            )

    def test_update_invalid_duration(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(
            db, doctor.id, start_time="09:00", end_time="10:00"
        )

        update_in = DoctorAvailabilityUpdate(duration_minutes=90)
        with pytest.raises(ValueError, match="duration_minutes.*cannot exceed the interval length"):
            crud.update_doctor_availability(
                session=db,
                db_availability=availability,
                availability_in=update_in,
            )

    def test_update_deactivate(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(db, doctor.id)

        update_in = DoctorAvailabilityUpdate(is_active=False)
        updated = crud.update_doctor_availability(
            session=db,
            db_availability=availability,
            availability_in=update_in,
        )
        assert updated.is_active is False


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


class TestDeleteDoctorAvailability:
    def test_delete_success(self, db: Session) -> None:
        _, doctor = _create_doctor_user(db)
        availability = _create_availability(db, doctor.id)
        avail_id = availability.id

        crud.delete_doctor_availability(
            session=db,
            db_availability=availability,
        )

        fetched = crud.get_doctor_availability(
            session=db,
            availability_id=avail_id,
        )
        assert fetched is None

    def test_delete_cascade_with_doctor(self, db: Session) -> None:
        """Deleting a doctor should cascade-delete their availability."""
        _, doctor = _create_doctor_user(db)
        _create_availability(db, doctor.id)
        _create_availability(db, doctor.id, weekday=Weekday.TUESDAY)

        # Delete the doctor
        db.delete(doctor)
        db.commit()

        records, total = crud.get_doctor_availabilities(
            session=db,
            doctor_id=doctor.id,
        )
        assert total == 0
