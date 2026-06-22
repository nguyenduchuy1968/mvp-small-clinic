"""Unit tests for Appointment CRUD validation logic.

These tests verify the validation functions directly without requiring a database.
Database-dependent functions (_validate_doctor_active, _validate_availability_window,
_check_double_booking) are tested in integration tests.

All time comparisons use the clinic's configured timezone
(settings.CLINIC_TIMEZONE) rather than UTC, ensuring that slot
availability correctly reflects the local date/time at the clinic.
"""

from datetime import date, datetime
from zoneinfo import ZoneInfo

import pytest
from app.core.config import settings
from app.crud import (
    _validate_appointment_date,
    _validate_contact_info,
    _validate_status_transition,
)
from app.models import AppointmentStatus, ContactMethod


class TestValidateAppointmentDate:
    def test_future_date_accepted(self):
        """A date far in the future should be accepted."""
        _validate_appointment_date(
            appointment_date=date(2099, 12, 31),
            appointment_time="10:00",
        )

    def test_past_date_rejected(self):
        """A date in the past should raise ValueError."""
        with pytest.raises(ValueError, match="is in the past"):
            _validate_appointment_date(
                appointment_date=date(2020, 1, 1),
                appointment_time="10:00",
            )

    def test_today_past_time_rejected(self):
        """A time today that has already passed should be rejected.

        Uses clinic local timezone (settings.CLINIC_TIMEZONE) so that
        the comparison correctly reflects the current local time at the
        clinic, not UTC.
        """
        clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
        now_local = datetime.now(clinic_tz)
        # Use a time that is definitely in the past (1 hour ago).
        # Handle midnight edge case: if now_local.hour == 0, use 00:00
        # as the past time (which is always in the past at 00:xx).
        if now_local.hour == 0:
            past_time = "00:00"
        else:
            past_hour = now_local.hour - 1
            past_time = f"{past_hour:02d}:{now_local.minute:02d}"

        with pytest.raises(ValueError, match="has already passed today"):
            _validate_appointment_date(
                appointment_date=now_local.date(),
                appointment_time=past_time,
            )

    def test_today_future_time_accepted(self):
        """A time today that is still in the future should be accepted.

        Uses clinic local timezone (settings.CLINIC_TIMEZONE) so that
        the comparison correctly reflects the current local time at the
        clinic, not UTC.
        """
        clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
        now_local = datetime.now(clinic_tz)
        # Use a time that is definitely in the future (2 hours from now)
        future_hour = (now_local.hour + 2) % 24
        future_time = f"{future_hour:02d}:00"

        _validate_appointment_date(
            appointment_date=now_local.date(),
            appointment_time=future_time,
        )


class TestValidateContactInfo:
    def test_phone_required_for_phone_method(self):
        """PHONE contact method requires patient_phone."""
        with pytest.raises(ValueError, match="patient_phone is required"):
            _validate_contact_info(
                contact_method=ContactMethod.PHONE,
                patient_phone="",
                patient_email=None,
            )

    def test_phone_required_for_whatsapp(self):
        """WHATSAPP contact method requires patient_phone."""
        with pytest.raises(ValueError, match="patient_phone is required"):
            _validate_contact_info(
                contact_method=ContactMethod.WHATSAPP,
                patient_phone="",
                patient_email=None,
            )

    def test_phone_required_for_viber(self):
        """VIBER contact method requires patient_phone."""
        with pytest.raises(ValueError, match="patient_phone is required"):
            _validate_contact_info(
                contact_method=ContactMethod.VIBER,
                patient_phone="",
                patient_email=None,
            )

    def test_phone_required_for_zalo(self):
        """ZALO contact method requires patient_phone."""
        with pytest.raises(ValueError, match="patient_phone is required"):
            _validate_contact_info(
                contact_method=ContactMethod.ZALO,
                patient_phone="",
                patient_email=None,
            )

    def test_email_required_for_email_method(self):
        """EMAIL contact method requires patient_email."""
        with pytest.raises(ValueError, match="patient_email is required"):
            _validate_contact_info(
                contact_method=ContactMethod.EMAIL,
                patient_phone="123",
                patient_email=None,
            )

    def test_telegram_requires_at_least_one_contact(self):
        """TELEGRAM requires at least one of patient_phone or patient_email."""
        with pytest.raises(ValueError, match="At least one"):
            _validate_contact_info(
                contact_method=ContactMethod.TELEGRAM,
                patient_phone="",
                patient_email="",
            )

    def test_telegram_with_phone_accepted(self):
        """TELEGRAM with patient_phone should pass."""
        _validate_contact_info(
            contact_method=ContactMethod.TELEGRAM,
            patient_phone="+1234567890",
            patient_email="",
        )

    def test_telegram_with_email_accepted(self):
        """TELEGRAM with patient_email should pass."""
        _validate_contact_info(
            contact_method=ContactMethod.TELEGRAM,
            patient_phone="",
            patient_email="test@example.com",
        )

    def test_telegram_with_both_accepted(self):
        """TELEGRAM with both contacts should pass."""
        _validate_contact_info(
            contact_method=ContactMethod.TELEGRAM,
            patient_phone="+1234567890",
            patient_email="test@example.com",
        )

    def test_phone_with_valid_phone_accepted(self):
        """PHONE with valid phone should pass."""
        _validate_contact_info(
            contact_method=ContactMethod.PHONE,
            patient_phone="+1234567890",
            patient_email=None,
        )

    def test_email_with_valid_email_accepted(self):
        """EMAIL with valid email should pass."""
        _validate_contact_info(
            contact_method=ContactMethod.EMAIL,
            patient_phone="",
            patient_email="test@example.com",
        )


class TestValidateStatusTransition:
    def test_pending_to_confirmed_allowed(self):
        """PENDING -> CONFIRMED is a valid transition."""
        _validate_status_transition(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
        )

    def test_pending_to_cancelled_allowed(self):
        """PENDING -> CANCELLED is a valid transition."""
        _validate_status_transition(
            AppointmentStatus.PENDING,
            AppointmentStatus.CANCELLED,
        )

    def test_confirmed_to_cancelled_allowed(self):
        """CONFIRMED -> CANCELLED is a valid transition."""
        _validate_status_transition(
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
        )

    def test_cancelled_to_pending_rejected(self):
        """CANCELLED -> PENDING is invalid."""
        with pytest.raises(ValueError, match="Invalid status transition"):
            _validate_status_transition(
                AppointmentStatus.CANCELLED,
                AppointmentStatus.PENDING,
            )

    def test_cancelled_to_confirmed_rejected(self):
        """CANCELLED -> CONFIRMED is invalid."""
        with pytest.raises(ValueError, match="Invalid status transition"):
            _validate_status_transition(
                AppointmentStatus.CANCELLED,
                AppointmentStatus.CONFIRMED,
            )

    def test_confirmed_to_pending_rejected(self):
        """CONFIRMED -> PENDING is invalid."""
        with pytest.raises(ValueError, match="Invalid status transition"):
            _validate_status_transition(
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.PENDING,
            )


class TestSlotAlignmentLogic:
    """Test the modulo-based slot alignment logic used by _validate_availability_window.

    These tests verify the arithmetic directly without requiring a database session.
    The full _validate_availability_window function (which queries the DB) is tested
    in integration tests.
    """

    def _offset_minutes(self, appointment_time: str, start_time: str) -> int:
        """Calculate offset_minutes = appointment_time - start_time."""
        from app.crud import _time_to_minutes
        return _time_to_minutes(appointment_time) - _time_to_minutes(start_time)

    # --- 30-minute slots: 09:00-12:00 ---
    def test_slot_30min_0900_valid(self):
        """09:00 is a valid slot boundary for 30-min intervals starting at 09:00."""
        offset = self._offset_minutes("09:00", "09:00")
        assert offset % 30 == 0

    def test_slot_30min_0930_valid(self):
        """09:30 is a valid slot boundary."""
        offset = self._offset_minutes("09:30", "09:00")
        assert offset % 30 == 0

    def test_slot_30min_1000_valid(self):
        """10:00 is a valid slot boundary."""
        offset = self._offset_minutes("10:00", "09:00")
        assert offset % 30 == 0

    def test_slot_30min_1130_valid(self):
        """11:30 is a valid slot boundary (last valid slot before 12:00)."""
        offset = self._offset_minutes("11:30", "09:00")
        assert offset % 30 == 0

    def test_slot_30min_0905_invalid(self):
        """09:05 is NOT a valid slot boundary for 30-min intervals."""
        offset = self._offset_minutes("09:05", "09:00")
        assert offset % 30 != 0

    def test_slot_30min_0917_invalid(self):
        """09:17 is NOT a valid slot boundary."""
        offset = self._offset_minutes("09:17", "09:00")
        assert offset % 30 != 0

    def test_slot_30min_1042_invalid(self):
        """10:42 is NOT a valid slot boundary."""
        offset = self._offset_minutes("10:42", "09:00")
        assert offset % 30 != 0

    def test_slot_30min_1115_invalid(self):
        """11:15 is NOT a valid slot boundary."""
        offset = self._offset_minutes("11:15", "09:00")
        assert offset % 30 != 0

    # --- 15-minute slots: 14:00-16:00 ---
    def test_slot_15min_1400_valid(self):
        """14:00 is a valid slot boundary for 15-min intervals."""
        offset = self._offset_minutes("14:00", "14:00")
        assert offset % 15 == 0

    def test_slot_15min_1415_valid(self):
        """14:15 is a valid slot boundary."""
        offset = self._offset_minutes("14:15", "14:00")
        assert offset % 15 == 0

    def test_slot_15min_1445_valid(self):
        """14:45 is a valid slot boundary."""
        offset = self._offset_minutes("14:45", "14:00")
        assert offset % 15 == 0

    def test_slot_15min_1550_invalid(self):
        """15:50 is NOT a valid slot boundary for 15-min intervals."""
        offset = self._offset_minutes("15:50", "14:00")
        assert offset % 15 != 0

    # --- 60-minute slots: 08:00-17:00 ---
    def test_slot_60min_0800_valid(self):
        """08:00 is a valid slot boundary for 60-min intervals."""
        offset = self._offset_minutes("08:00", "08:00")
        assert offset % 60 == 0

    def test_slot_60min_1000_valid(self):
        """10:00 is a valid slot boundary."""
        offset = self._offset_minutes("10:00", "08:00")
        assert offset % 60 == 0

    def test_slot_60min_1600_valid(self):
        """16:00 is a valid slot boundary."""
        offset = self._offset_minutes("16:00", "08:00")
        assert offset % 60 == 0

    def test_slot_60min_0930_invalid(self):
        """09:30 is NOT a valid slot boundary for 60-min intervals."""
        offset = self._offset_minutes("09:30", "08:00")
        assert offset % 60 != 0

    # --- Edge cases ---
    def test_slot_exact_start_time(self):
        """The exact start time is always a valid slot boundary."""
        offset = self._offset_minutes("09:00", "09:00")
        assert offset % 30 == 0
        assert offset == 0

    def test_slot_offset_multiple_of_duration(self):
        """offset_minutes % duration_minutes == 0 is the core validation rule."""
        # 10:00 - 09:00 = 60 minutes, 60 % 30 == 0 ✅
        assert self._offset_minutes("10:00", "09:00") % 30 == 0
        # 10:00 - 09:00 = 60 minutes, 60 % 15 == 0 ✅
        assert self._offset_minutes("10:00", "09:00") % 15 == 0
        # 10:00 - 09:00 = 60 minutes, 60 % 45 != 0 ❌
        assert self._offset_minutes("10:00", "09:00") % 45 != 0
