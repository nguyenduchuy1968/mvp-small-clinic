"""API tests for Doctor Availability.

Tests the REST API layer.
Verifies HTTP status codes, response bodies, and permission enforcement.
"""

import uuid

from app.core.config import settings
from app.models import User, UserRole, Weekday
from fastapi.testclient import TestClient
from sqlmodel import Session
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import random_email, random_lower_string

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
        "specialization": "Cardiology",
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
        "specialization": "Cardiology",
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
    weekday: str = "monday",
    start_time: str = "09:00",
    end_time: str = "12:00",
    duration_minutes: int = 30,
    is_active: bool = True,
) -> dict:
    """Create an availability slot via API and return the response dict."""
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


# ---------------------------------------------------------------------------
# GET /doctors/{doctor_id}/availability
# ---------------------------------------------------------------------------


class TestReadDoctorAvailabilities:
    def test_read_empty(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["data"] == []
        assert data["count"] == 0

    def test_read_with_slots(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        # Create two slots
        _create_availability_slot(
            client, doctor_id, superuser_token_headers, weekday="monday"
        )
        _create_availability_slot(
            client, doctor_id, superuser_token_headers, weekday="tuesday"
        )

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 2
        assert len(data["data"]) == 2

    def test_read_doctor_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{fake_id}/availability",
            headers=superuser_token_headers,
        )
        assert r.status_code == 404
        assert r.json()["detail"] == "Doctor not found"

    def test_read_unauthenticated(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/availability",
        )
        assert r.status_code == 401

    def test_read_pagination(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        for i in range(5):
            _create_availability_slot(
                client,
                doctor_id,
                superuser_token_headers,
                weekday="monday",
                start_time=f"{9 + i:02d}:00",
                end_time=f"{10 + i:02d}:00",
            )

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability?skip=2&limit=2",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 5
        assert len(data["data"]) == 2

    def test_read_active_only(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        _create_availability_slot(
            client, doctor_id, superuser_token_headers, weekday="monday", is_active=True
        )
        _create_availability_slot(
            client,
            doctor_id,
            superuser_token_headers,
            weekday="tuesday",
            is_active=False,
        )

        # Default: active_only=true
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 1

        # Explicitly include inactive
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability?active_only=false",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 2


# ---------------------------------------------------------------------------
# POST /doctors/{doctor_id}/availability
# ---------------------------------------------------------------------------


class TestCreateDoctorAvailability:
    def test_create_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        data = {
            "weekday": "monday",
            "start_time": "09:00",
            "end_time": "12:00",
            "duration_minutes": 30,
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=superuser_token_headers,
            json=data,
        )
        assert r.status_code == 201
        result = r.json()
        assert result["weekday"] == "monday"
        assert result["start_time"] == "09:00"
        assert result["end_time"] == "12:00"
        assert result["duration_minutes"] == 30
        assert result["is_active"] is True
        assert "id" in result
        assert "doctor_id" in result
        assert result["doctor_id"] == doctor_id
        assert "created_at" in result
        assert "updated_at" in result

    def test_create_doctor_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        fake_id = str(uuid.uuid4())
        data = {
            "weekday": "monday",
            "start_time": "09:00",
            "end_time": "12:00",
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{fake_id}/availability",
            headers=superuser_token_headers,
            json=data,
        )
        assert r.status_code == 404
        assert "not found" in r.json()["detail"].lower()

    def test_create_overlap_returns_409(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        # Create first slot
        _create_availability_slot(client, doctor_id, superuser_token_headers)

        # Create overlapping slot
        data = {
            "weekday": "monday",
            "start_time": "10:00",
            "end_time": "14:00",
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=superuser_token_headers,
            json=data,
        )
        assert r.status_code == 409
        assert "overlap" in r.json()["detail"].lower()

    def test_create_invalid_time_range_returns_400(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        data = {
            "weekday": "monday",
            "start_time": "17:00",
            "end_time": "09:00",
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=superuser_token_headers,
            json=data,
        )
        assert r.status_code == 400

    def test_create_invalid_duration_returns_400(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        data = {
            "weekday": "monday",
            "start_time": "09:00",
            "end_time": "10:00",
            "duration_minutes": 90,
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=superuser_token_headers,
            json=data,
        )
        assert r.status_code == 400

    def test_create_unauthenticated(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        data = {
            "weekday": "monday",
            "start_time": "09:00",
            "end_time": "12:00",
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/availability",
            json=data,
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /availability/{availability_id}
# ---------------------------------------------------------------------------


class TestUpdateDoctorAvailability:
    def test_update_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        slot = _create_availability_slot(client, doctor_id, superuser_token_headers)
        slot_id = slot["id"]

        update_data = {"end_time": "14:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{slot_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 200
        result = r.json()
        assert result["end_time"] == "14:00"
        assert result["start_time"] == "09:00"  # unchanged
        assert result["id"] == slot_id

    def test_update_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        fake_id = str(uuid.uuid4())
        update_data = {"end_time": "14:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{fake_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 404
        assert "Availability not found" in r.json()["detail"]

    def test_update_overlap_returns_409(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]

        slot1 = _create_availability_slot(
            client,
            doctor_id,
            superuser_token_headers,
            weekday="monday",
            start_time="09:00",
            end_time="12:00",
        )
        slot2 = _create_availability_slot(
            client,
            doctor_id,
            superuser_token_headers,
            weekday="monday",
            start_time="13:00",
            end_time="17:00",
        )

        # Try to update slot2 to overlap with slot1
        update_data = {"start_time": "10:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{slot2['id']}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 409
        assert "overlap" in r.json()["detail"].lower()

    def test_update_invalid_time_range_returns_400(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        doctor_id = doctor["id"]
        slot = _create_availability_slot(client, doctor_id, superuser_token_headers)

        update_data = {"end_time": "08:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 400

    def test_update_unauthenticated(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        slot = _create_availability_slot(client, doctor["id"], superuser_token_headers)

        update_data = {"end_time": "14:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            json=update_data,
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /availability/{availability_id}
# ---------------------------------------------------------------------------


class TestDeleteDoctorAvailability:
    def test_delete_success(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        slot = _create_availability_slot(client, doctor["id"], superuser_token_headers)
        slot_id = slot["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/availability/{slot_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["message"] == "Availability deleted successfully"

        # Verify it's gone
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/availability",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["count"] == 0

    def test_delete_not_found(
        self, client: TestClient, superuser_token_headers: dict[str, str]
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.delete(
            f"{settings.API_V1_STR}/availability/{fake_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 404
        assert "Availability not found" in r.json()["detail"]

    def test_delete_unauthenticated(
        self, client: TestClient, superuser_token_headers: dict[str, str], db: Session
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        slot = _create_availability_slot(client, doctor["id"], superuser_token_headers)

        r = client.delete(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Permission Tests
# ---------------------------------------------------------------------------


class TestDoctorPermissions:
    """Doctors can only access their own availability."""

    def test_doctor_read_own_availability(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor, token_headers = _create_doctor_user_token(client, db)
        doctor_id = doctor["id"]

        # Create a slot as this doctor
        _create_availability_slot(client, doctor_id, token_headers)

        # Read own availability
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=token_headers,
        )
        assert r.status_code == 200
        assert r.json()["count"] == 1

    def test_doctor_create_own_availability(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor, token_headers = _create_doctor_user_token(client, db)
        doctor_id = doctor["id"]

        data = {
            "weekday": "monday",
            "start_time": "09:00",
            "end_time": "12:00",
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor_id}/availability",
            headers=token_headers,
            json=data,
        )
        assert r.status_code == 201

    def test_doctor_update_own_availability(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor, token_headers = _create_doctor_user_token(client, db)
        doctor_id = doctor["id"]
        slot = _create_availability_slot(client, doctor_id, token_headers)

        update_data = {"end_time": "14:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            headers=token_headers,
            json=update_data,
        )
        assert r.status_code == 200

    def test_doctor_delete_own_availability(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        doctor, token_headers = _create_doctor_user_token(client, db)
        doctor_id = doctor["id"]
        slot = _create_availability_slot(client, doctor_id, token_headers)

        r = client.delete(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            headers=token_headers,
        )
        assert r.status_code == 200

    def test_doctor_cannot_read_another_doctor(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        # Create doctor A (the victim)
        doctor_a, _ = _create_doctor_user_token(client, db)
        # Create doctor B (the attacker)
        _, attacker_headers = _create_doctor_user_token(client, db)

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_a['id']}/availability",
            headers=attacker_headers,
        )
        assert r.status_code == 403

    def test_doctor_cannot_create_for_another_doctor(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        # Create doctor A (the victim)
        doctor_a, _ = _create_doctor_user_token(client, db)
        # Create doctor B (the attacker)
        _, attacker_headers = _create_doctor_user_token(client, db)

        data = {
            "weekday": "monday",
            "start_time": "09:00",
            "end_time": "12:00",
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor_a['id']}/availability",
            headers=attacker_headers,
            json=data,
        )
        assert r.status_code == 403

    def test_doctor_cannot_update_another_doctors_slot(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        # Create doctor A and a slot
        doctor_a, _ = _create_doctor_user_token(client, db)
        superuser_headers = _get_superuser_headers(client)
        slot = _create_availability_slot(client, doctor_a["id"], superuser_headers)

        # Create doctor B (the attacker)
        _, attacker_headers = _create_doctor_user_token(client, db)

        update_data = {"end_time": "14:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            headers=attacker_headers,
            json=update_data,
        )
        assert r.status_code == 403

    def test_doctor_cannot_delete_another_doctors_slot(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        # Create doctor A and a slot
        doctor_a, _ = _create_doctor_user_token(client, db)
        superuser_headers = _get_superuser_headers(client)
        slot = _create_availability_slot(client, doctor_a["id"], superuser_headers)

        # Create doctor B (the attacker)
        _, attacker_headers = _create_doctor_user_token(client, db)

        r = client.delete(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            headers=attacker_headers,
        )
        assert r.status_code == 403


class TestAdminPermissions:
    """Admins can access any doctor's availability."""

    def test_admin_read_any_doctor(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        _create_availability_slot(client, doctor["id"], superuser_token_headers)

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/availability",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200

    def test_admin_create_for_any_doctor(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)

        data = {
            "weekday": "monday",
            "start_time": "09:00",
            "end_time": "12:00",
        }
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/availability",
            headers=superuser_token_headers,
            json=data,
        )
        assert r.status_code == 201

    def test_admin_update_any_slot(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        slot = _create_availability_slot(client, doctor["id"], superuser_token_headers)

        update_data = {"end_time": "14:00"}
        r = client.patch(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 200

    def test_admin_delete_any_slot(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = _create_doctor_via_api(client, superuser_token_headers)
        slot = _create_availability_slot(client, doctor["id"], superuser_token_headers)

        r = client.delete(
            f"{settings.API_V1_STR}/availability/{slot['id']}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
