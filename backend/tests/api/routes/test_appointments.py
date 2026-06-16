"""API tests for Appointment Booking.

Tests the REST API layer.
Verifies HTTP status codes, response bodies, and permission enforcement.
"""

import uuid
from datetime import date, timedelta

from app.core.config import settings
from app.models import User, UserRole, Weekday
from fastapi.testclient import TestClient
from sqlmodel import Session
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import random_email, random_lower_string

# ---------------------------------------------------------------------------
# Test constants
# ---------------------------------------------------------------------------

# Use tomorrow to avoid past-date validation issues
_TODAY = date.today()
_TOMORROW = _TODAY + timedelta(days=1)
_TOMORROW_STR = _TOMORROW.isoformat()
_TOMORROW_WEEKDAY = _TOMORROW.strftime("%A").lower()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_doctor_via_api(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> dict:
    """Create a doctor via the API and return the doctor dict."""
    email = random_email()
    password = random_lower_string()
    doctor_data = {
        "email": email,
        "password": password,
        "full_name": "Test Doctor",
        "specialty": "Cardiology",
        "experience_years": 10,
        "phone": "+380501234567",
        "consultation_duration": 30,
        "is_active": True,
    }
    r = client.post(
        f"{settings.API_V1_STR}/doctors/",
        headers=superuser_token_headers,
        json=doctor_data,
    )
    assert r.status_code == 201
    return r.json()


def _create_doctor_user_token(
    client: TestClient, db: Session
) -> tuple[dict, dict[str, str]]:
    """Create a doctor user and return (doctor_dict, token_headers)."""
    email = random_email()
    password = random_lower_string()
    doctor_data = {
        "email": email,
        "password": password,
        "full_name": "Dr. Own",
        "specialty": "Cardiology",
        "experience_years": 5,
        "phone": "+380501234568",
        "consultation_duration": 30,
        "is_active": True,
    }
    # Use superuser to create the doctor
    superuser_headers = _get_superuser_headers(client)
    r = client.post(
        f"{settings.API_V1_STR}/doctors/",
        headers=superuser_headers,
        json=doctor_data,
    )
    assert r.status_code == 201
    doctor = r.json()

    # Get token for this doctor user
    token_headers = authentication_token_from_email(
        client=client,
        email=email,
        db=db,
    )
    return doctor, token_headers


def _get_superuser_headers(client: TestClient) -> dict[str, str]:
    """Get superuser token headers."""
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    r = client.post(f"{settings.API_V1_STR}/login/access-token", data=login_data)
    tokens = r.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _create_availability_slot(
    client: TestClient,
    doctor_id: str,
    headers: dict[str, str],
    weekday: str | None = None,
    start_time: str = "09:00",
    end_time: str = "12:00",
    duration_minutes: int = 30,
    is_active: bool = True,
) -> dict:
    """Create an availability slot via API and return the response dict."""
    if weekday is None:
        weekday = _TOMORROW_WEEKDAY
    data = {
        "weekday": weekday,
        "start_time": start_time,
        "end_time": end_time,
        "duration_minutes": duration_minutes,
        "is_active": is_active,
    }
    r = client.post(
        f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
        headers=headers,
        json=data,
    )
    assert r.status_code == 201
    return r.json()


def _create_appointment_payload(
    doctor_id: str,
    appointment_time: str = "09:00",
    contact_method: str = "phone",
) -> dict:
    """Create a standard appointment creation payload."""
    return {
        "doctor_id": doctor_id,
        "patient_name": "John Doe",
        "patient_phone": "+380501234569",
        "patient_email": "john@example.com",
        "contact_method": contact_method,
        "appointment_date": _TOMORROW_STR,
        "appointment_time": appointment_time,
        "notes": "Test appointment",
    }


# ---------------------------------------------------------------------------
# GET /doctors/{doctor_id}/slots?date=YYYY-MM-DD
# ---------------------------------------------------------------------------


class TestGetAvailableSlots:
    """Public endpoint — no authentication required."""

    def test_get_slots_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        # Create availability for tomorrow's weekday
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/slots",
            params={"date": _TOMORROW_STR},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["doctor_id"] == doctor_id
        assert data["date"] == _TOMORROW_STR
        assert data["count"] > 0
        assert len(data["slots"]) == data["count"]
        # 09:00-12:00 with 30-min slots → 6 slots
        assert data["count"] == 6
        assert data["slots"][0]["time"] == "09:00"
        assert data["slots"][-1]["time"] == "11:30"

    def test_get_slots_doctor_not_found(
        self, client: TestClient
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{fake_id}/slots",
            params={"date": _TOMORROW_STR},
        )
        assert r.status_code == 404
        assert r.json()["detail"] == "Doctor not found"

    def test_get_slots_no_availability(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        # No availability created
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/slots",
            params={"date": _TOMORROW_STR},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 0
        assert data["slots"] == []

    def test_get_slots_public_no_auth(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        """Public endpoint should work without authentication."""
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/slots",
            params={"date": _TOMORROW_STR},
        )
        assert r.status_code == 200


# ---------------------------------------------------------------------------
# POST /appointments
# ---------------------------------------------------------------------------


class TestCreateAppointment:
    """Public endpoint — no authentication required."""

    def test_create_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(
            f"{settings.API_V1_STR}/appointments",
            json=payload,
        )
        assert r.status_code == 201
        result = r.json()
        assert result["doctor_id"] == doctor_id
        assert result["patient_name"] == "John Doe"
        assert result["appointment_date"] == _TOMORROW_STR
        assert result["appointment_time"] == "09:00"
        assert result["status"] == "pending"
        assert "id" in result
        assert "created_at" in result

    def test_create_invalid_slot_returns_400(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        """Non-aligned time (e.g., 09:07) should return 400."""
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id, appointment_time="09:07")
        r = client.post(
            f"{settings.API_V1_STR}/appointments",
            json=payload,
        )
        assert r.status_code == 400
        assert "slot" in r.json()["detail"].lower() or "align" in r.json()["detail"].lower()

    def test_create_double_booking_returns_409(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        """Same doctor, date, time should return 409."""
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        # First booking succeeds
        r1 = client.post(
            f"{settings.API_V1_STR}/appointments",
            json=payload,
        )
        assert r1.status_code == 201

        # Second booking at same slot fails
        r2 = client.post(
            f"{settings.API_V1_STR}/appointments",
            json=payload,
        )
        assert r2.status_code == 409
        assert "already booked" in r2.json()["detail"].lower() or "double" in r2.json()["detail"].lower()

    def test_create_public_no_auth(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        """Public endpoint should work without authentication."""
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(
            f"{settings.API_V1_STR}/appointments",
            json=payload,
        )
        assert r.status_code == 201


# ---------------------------------------------------------------------------
# GET /appointments/{appointment_id}
# ---------------------------------------------------------------------------


class TestReadAppointment:
    """Authenticated endpoint."""

    def test_read_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        # Create appointment (public)
        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # Read appointment (authenticated)
        r = client.get(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        result = r.json()
        assert result["id"] == appointment_id
        assert result["patient_name"] == "John Doe"

    def test_read_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.get(
            f"{settings.API_V1_STR}/appointments/{fake_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 404
        assert "Appointment not found" in r.json()["detail"]

    def test_read_unauthenticated(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # No auth header
        r = client.get(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# GET /appointments
# ---------------------------------------------------------------------------


class TestReadAppointments:
    """Authenticated endpoint with filters."""

    def test_list_all(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        # Create two appointments
        payload1 = _create_appointment_payload(doctor_id, appointment_time="09:00")
        client.post(f"{settings.API_V1_STR}/appointments", json=payload1)

        payload2 = _create_appointment_payload(doctor_id, appointment_time="09:30")
        client.post(f"{settings.API_V1_STR}/appointments", json=payload2)

        r = client.get(
            f"{settings.API_V1_STR}/appointments",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] >= 2
        assert len(data["data"]) >= 2

    def test_list_filter_by_doctor(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        client.post(f"{settings.API_V1_STR}/appointments", json=payload)

        r = client.get(
            f"{settings.API_V1_STR}/appointments",
            headers=superuser_token_headers,
            params={"doctor_id": doctor_id},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] >= 1
        assert all(a["doctor_id"] == doctor_id for a in data["data"])

    def test_list_filter_by_status(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        client.post(f"{settings.API_V1_STR}/appointments", json=payload)

        r = client.get(
            f"{settings.API_V1_STR}/appointments",
            headers=superuser_token_headers,
            params={"status": "pending"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] >= 1
        assert all(a["status"] == "pending" for a in data["data"])

    def test_list_pagination(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(
            client, doctor_id, superuser_token_headers,
            start_time="09:00", end_time="11:00",
        )

        # Create 3 appointments
        for time in ["09:00", "09:30", "10:00"]:
            payload = _create_appointment_payload(doctor_id, appointment_time=time)
            client.post(f"{settings.API_V1_STR}/appointments", json=payload)

        r = client.get(
            f"{settings.API_V1_STR}/appointments",
            headers=superuser_token_headers,
            params={"skip": 1, "limit": 2},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] >= 3
        assert len(data["data"]) == 2

    def test_list_unauthenticated(
        self, client: TestClient
    ) -> None:
        r = client.get(
            f"{settings.API_V1_STR}/appointments",
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /appointments/{appointment_id}/status
# ---------------------------------------------------------------------------


class TestUpdateAppointmentStatus:
    """Authenticated endpoint."""

    def test_update_status_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # PENDING → CONFIRMED
        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            headers=superuser_token_headers,
            json={"status": "confirmed"},
        )
        assert r.status_code == 200
        result = r.json()
        assert result["status"] == "confirmed"

    def test_update_invalid_transition_returns_400(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # PENDING → CONFIRMED → CANCELLED (valid)
        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            headers=superuser_token_headers,
            json={"status": "confirmed"},
        )
        assert r.status_code == 200

        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            headers=superuser_token_headers,
            json={"status": "cancelled"},
        )
        assert r.status_code == 200

        # CANCELLED → CONFIRMED (invalid)
        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            headers=superuser_token_headers,
            json={"status": "confirmed"},
        )
        assert r.status_code == 400

    def test_update_status_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{fake_id}/status",
            headers=superuser_token_headers,
            json={"status": "confirmed"},
        )
        assert r.status_code == 404
        assert "Appointment not found" in r.json()["detail"]

    def test_update_status_unauthenticated(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            json={"status": "confirmed"},
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /appointments/{appointment_id}
# ---------------------------------------------------------------------------


class TestDeleteAppointment:
    """Authenticated endpoint."""

    def test_delete_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["message"] == "Appointment deleted successfully"

        # Verify it's gone
        r = client.get(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 404

    def test_delete_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.delete(
            f"{settings.API_V1_STR}/appointments/{fake_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 404
        assert "Appointment not found" in r.json()["detail"]

    def test_delete_unauthenticated(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Public Booking Flow (End-to-End)
# ---------------------------------------------------------------------------


class TestPublicBookingFlow:
    """End-to-end test of the public booking flow."""

    def test_full_booking_flow(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        """Patient: view slots → book → verify booking."""
        # 1. Create doctor with availability
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        # 2. View available slots (public)
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/slots",
            params={"date": _TOMORROW_STR},
        )
        assert r.status_code == 200
        slots = r.json()
        assert slots["count"] > 0
        first_slot = slots["slots"][0]["time"]

        # 3. Book the first slot (public)
        payload = _create_appointment_payload(doctor_id, appointment_time=first_slot)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # 4. Verify the booked slot is no longer available
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/slots",
            params={"date": _TOMORROW_STR},
        )
        assert r.status_code == 200
        remaining = r.json()
        booked_times = [s["time"] for s in remaining["slots"]]
        assert first_slot not in booked_times
        assert remaining["count"] == slots["count"] - 1

        # 5. Verify booking via authenticated endpoint
        r = client.get(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "pending"


# ---------------------------------------------------------------------------
# Permission Tests
# ---------------------------------------------------------------------------


class TestDoctorPermissions:
    """Doctors can only access their own appointments."""

    def test_doctor_read_own_appointment(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor, token_headers = _create_doctor_user_token(client, db)
        doctor_id = doctor["id"]
        superuser_headers = _get_superuser_headers(client)

        # Create availability and appointment via superuser
        _create_availability_slot(client, doctor_id, superuser_headers)
        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # Doctor reads own appointment
        r = client.get(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=token_headers,
        )
        assert r.status_code == 200
        assert r.json()["id"] == appointment_id

    def test_doctor_cannot_read_another_doctors_appointment(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        # Create doctor A (the victim)
        doctor_a, _ = _create_doctor_user_token(client, db)
        superuser_headers = _get_superuser_headers(client)

        # Create appointment for doctor A
        _create_availability_slot(client, doctor_a["id"], superuser_headers)
        payload = _create_appointment_payload(doctor_a["id"])
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # Create doctor B (the attacker)
        _, attacker_headers = _create_doctor_user_token(client, db)

        # Doctor B tries to read doctor A's appointment
        r = client.get(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=attacker_headers,
        )
        assert r.status_code == 403

    def test_doctor_list_own_appointments_only(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Doctor listing appointments should only see their own."""
        # Create doctor A
        doctor_a, token_a = _create_doctor_user_token(client, db)
        superuser_headers = _get_superuser_headers(client)

        # Create appointment for doctor A
        _create_availability_slot(client, doctor_a["id"], superuser_headers)
        payload = _create_appointment_payload(doctor_a["id"])
        client.post(f"{settings.API_V1_STR}/appointments", json=payload)

        # Create doctor B with appointment
        doctor_b, _ = _create_doctor_user_token(client, db)
        _create_availability_slot(
            client, doctor_b["id"], superuser_headers,
            start_time="10:00", end_time="12:00",
        )
        payload_b = _create_appointment_payload(doctor_b["id"], appointment_time="10:00")
        client.post(f"{settings.API_V1_STR}/appointments", json=payload_b)

        # Doctor A lists appointments — should only see their own
        r = client.get(
            f"{settings.API_V1_STR}/appointments",
            headers=token_a,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] >= 1
        for appt in data["data"]:
            assert appt["doctor_id"] == doctor_a["id"]

    def test_doctor_update_own_appointment_status(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor, token_headers = _create_doctor_user_token(client, db)
        doctor_id = doctor["id"]
        superuser_headers = _get_superuser_headers(client)

        _create_availability_slot(client, doctor_id, superuser_headers)
        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        # Doctor updates own appointment status
        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            headers=token_headers,
            json={"status": "confirmed"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

    def test_doctor_cannot_update_another_doctors_appointment(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor_a, _ = _create_doctor_user_token(client, db)
        superuser_headers = _get_superuser_headers(client)

        _create_availability_slot(client, doctor_a["id"], superuser_headers)
        payload = _create_appointment_payload(doctor_a["id"])
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        _, attacker_headers = _create_doctor_user_token(client, db)

        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            headers=attacker_headers,
            json={"status": "confirmed"},
        )
        assert r.status_code == 403

    def test_doctor_delete_own_appointment(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor, token_headers = _create_doctor_user_token(client, db)
        doctor_id = doctor["id"]
        superuser_headers = _get_superuser_headers(client)

        _create_availability_slot(client, doctor_id, superuser_headers)
        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=token_headers,
        )
        assert r.status_code == 200

    def test_doctor_cannot_delete_another_doctors_appointment(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor_a, _ = _create_doctor_user_token(client, db)
        superuser_headers = _get_superuser_headers(client)

        _create_availability_slot(client, doctor_a["id"], superuser_headers)
        payload = _create_appointment_payload(doctor_a["id"])
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        _, attacker_headers = _create_doctor_user_token(client, db)

        r = client.delete(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=attacker_headers,
        )
        assert r.status_code == 403


class TestAdminPermissions:
    """Admins can access any appointment."""

    def test_admin_read_any_appointment(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        r = client.get(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200

    def test_admin_list_all_appointments(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        client.post(f"{settings.API_V1_STR}/appointments", json=payload)

        r = client.get(
            f"{settings.API_V1_STR}/appointments",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] >= 1

    def test_admin_update_any_appointment_status(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        r = client.patch(
            f"{settings.API_V1_STR}/appointments/{appointment_id}/status",
            headers=superuser_token_headers,
            json={"status": "confirmed"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

    def test_admin_delete_any_appointment(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        payload = _create_appointment_payload(doctor_id)
        r = client.post(f"{settings.API_V1_STR}/appointments", json=payload)
        assert r.status_code == 201
        appointment_id = r.json()["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/appointments/{appointment_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["message"] == "Appointment deleted successfully"