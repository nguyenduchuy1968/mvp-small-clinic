"""API tests for Blocked Dates.

Tests the REST API layer.
Verifies HTTP status codes, response bodies, and permission enforcement.
"""

import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.models import User, UserRole
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
    assert r.status_code == 200
    tokens = r.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _future_date_str(days_ahead: int = 30) -> str:
    """Return a future date string in YYYY-MM-DD format."""
    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    today_local = datetime.now(clinic_tz).date()
    future = today_local + timedelta(days=days_ahead)
    return future.isoformat()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


class TestCreateBlockedDatesAPI:
    def test_create_single_date(self, client: TestClient, db: Session) -> None:
        """POST /doctors/{id}/blocked-dates with a single date should succeed."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        future = _future_date_str(10)

        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future], "reason": "Clinic closed"},
        )
        assert r.status_code == 201
        data = r.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["blocked_date"] == future
        assert data["data"][0]["reason"] == "Clinic closed"

    def test_create_multiple_dates(self, client: TestClient, db: Session) -> None:
        """POST with multiple dates should create all of them."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        future1 = _future_date_str(10)
        future2 = _future_date_str(11)
        future3 = _future_date_str(12)

        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future1, future2, future3], "reason": "Vacation"},
        )
        assert r.status_code == 201
        data = r.json()
        assert len(data["data"]) == 3

    def test_create_duplicate_returns_409(
        self, client: TestClient, db: Session
    ) -> None:
        """POST with a duplicate date should return 409 Conflict."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        future = _future_date_str(10)

        # First creation
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future], "reason": "First"},
        )
        assert r.status_code == 201

        # Duplicate
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future], "reason": "Second"},
        )
        assert r.status_code == 409

    def test_create_past_date_returns_409(
        self, client: TestClient, db: Session
    ) -> None:
        """POST with a past date should return 409 Conflict."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        past_date = "2020-01-01"

        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [past_date], "reason": "Test"},
        )
        assert r.status_code == 409

    def test_create_nonexistent_doctor_returns_404(
        self, client: TestClient, db: Session
    ) -> None:
        """POST for a non-existent doctor should return 404."""
        superuser_headers = _get_superuser_headers(client)
        fake_id = uuid.uuid4()
        future = _future_date_str(10)

        r = client.post(
            f"{settings.API_V1_STR}/doctors/{fake_id}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future], "reason": "Test"},
        )
        assert r.status_code == 404

    def test_create_requires_auth(self, client: TestClient, db: Session) -> None:
        """POST without auth should return 401."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        future = _future_date_str(10)

        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            json={"dates": [future], "reason": "Test"},
        )
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


class TestGetBlockedDatesAPI:
    def test_get_empty(self, client: TestClient, db: Session) -> None:
        """GET with no blocked dates should return empty list."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert len(data["data"]) == 0

    def test_get_with_records(self, client: TestClient, db: Session) -> None:
        """GET should return created blocked dates."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        future = _future_date_str(10)

        # Create one
        client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future], "reason": "Test"},
        )

        # Read
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["blocked_date"] == future

    def test_get_nonexistent_doctor_returns_404(
        self, client: TestClient, db: Session
    ) -> None:
        """GET for a non-existent doctor should return 404."""
        superuser_headers = _get_superuser_headers(client)
        fake_id = uuid.uuid4()

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{fake_id}/blocked-dates",
            headers=superuser_headers,
        )
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


class TestDeleteBlockedDateAPI:
    def test_delete_success(self, client: TestClient, db: Session) -> None:
        """DELETE should remove a blocked date."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        future = _future_date_str(10)

        # Create
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future], "reason": "Test"},
        )
        blocked_id = r.json()["data"][0]["id"]

        # Delete
        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates/{blocked_id}",
            headers=superuser_headers,
        )
        assert r.status_code == 200
        assert r.json()["message"] == "Blocked date deleted successfully"

        # Verify gone
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=superuser_headers,
        )
        assert len(r.json()["data"]) == 0

    def test_delete_nonexistent_returns_404(
        self, client: TestClient, db: Session
    ) -> None:
        """DELETE for a non-existent blocked date should return 404."""
        superuser_headers = _get_superuser_headers(client)
        doctor = _create_doctor_via_api(client, superuser_headers)
        fake_id = uuid.uuid4()

        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates/{fake_id}",
            headers=superuser_headers,
        )
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Permission: Doctor can only access their own blocked dates
# ---------------------------------------------------------------------------


class TestBlockedDatesPermissions:
    def test_doctor_can_create_own(self, client: TestClient, db: Session) -> None:
        """A doctor user should be able to create blocked dates for themselves."""
        doctor, token_headers = _create_doctor_user_token(client, db)
        future = _future_date_str(10)

        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=token_headers,
            json={"dates": [future], "reason": "My day off"},
        )
        assert r.status_code == 201

    def test_doctor_cannot_create_for_other(
        self, client: TestClient, db: Session
    ) -> None:
        """A doctor user should not be able to create blocked dates for another doctor."""
        # Create doctor1 (the victim)
        superuser_headers = _get_superuser_headers(client)
        doctor1 = _create_doctor_via_api(client, superuser_headers)

        # Create doctor2 (the attacker)
        _, doctor2_token = _create_doctor_user_token(client, db)
        future = _future_date_str(10)

        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor1['id']}/blocked-dates",
            headers=doctor2_token,
            json={"dates": [future], "reason": "Malicious"},
        )
        assert r.status_code == 403

    def test_doctor_can_read_own(self, client: TestClient, db: Session) -> None:
        """A doctor user should be able to read their own blocked dates."""
        doctor, token_headers = _create_doctor_user_token(client, db)
        future = _future_date_str(10)

        # Create
        client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=token_headers,
            json={"dates": [future], "reason": "My day off"},
        )

        # Read
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=token_headers,
        )
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1

    def test_doctor_cannot_read_other(self, client: TestClient, db: Session) -> None:
        """A doctor user should not be able to read another doctor's blocked dates."""
        superuser_headers = _get_superuser_headers(client)
        doctor1 = _create_doctor_via_api(client, superuser_headers)
        _, doctor2_token = _create_doctor_user_token(client, db)

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor1['id']}/blocked-dates",
            headers=doctor2_token,
        )
        assert r.status_code == 403

    def test_doctor_can_delete_own(self, client: TestClient, db: Session) -> None:
        """A doctor user should be able to delete their own blocked dates."""
        doctor, token_headers = _create_doctor_user_token(client, db)
        future = _future_date_str(10)

        # Create
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates",
            headers=token_headers,
            json={"dates": [future], "reason": "My day off"},
        )
        blocked_id = r.json()["data"][0]["id"]

        # Delete
        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor['id']}/blocked-dates/{blocked_id}",
            headers=token_headers,
        )
        assert r.status_code == 200

    def test_doctor_cannot_delete_other(self, client: TestClient, db: Session) -> None:
        """A doctor user should not be able to delete another doctor's blocked dates."""
        superuser_headers = _get_superuser_headers(client)
        doctor1 = _create_doctor_via_api(client, superuser_headers)
        _, doctor2_token = _create_doctor_user_token(client, db)

        # Create blocked date for doctor1 as superuser
        future = _future_date_str(10)
        r = client.post(
            f"{settings.API_V1_STR}/doctors/{doctor1['id']}/blocked-dates",
            headers=superuser_headers,
            json={"dates": [future], "reason": "Admin block"},
        )
        blocked_id = r.json()["data"][0]["id"]

        # Try to delete as doctor2
        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor1['id']}/blocked-dates/{blocked_id}",
            headers=doctor2_token,
        )
        assert r.status_code == 403
