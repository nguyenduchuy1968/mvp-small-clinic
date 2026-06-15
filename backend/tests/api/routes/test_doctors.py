import uuid

from app import crud
from app.core.config import settings
from app.models import Doctor, User, UserRole
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from tests.utils.user import create_random_user
from tests.utils.utils import random_email, random_lower_string


def create_test_doctor(
    db: Session, client: TestClient, superuser_token_headers: dict[str, str]
) -> dict:
    """Helper to create a doctor via the new business workflow."""
    email = random_email()
    password = random_lower_string()

    doctor_data = {
        "email": email,
        "password": password,
        "full_name": "Test Doctor",
        "specialty": "Cardiology",
        "experience_years": 10,
        "bio": "Experienced cardiologist",
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


class TestCreateDoctor:
    def test_create_doctor_success(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. Smith",
            "specialty": "Cardiology",
            "experience_years": 15,
            "bio": "Senior cardiologist",
            "phone": "+380501234568",
            "consultation_duration": 30,
            "is_active": True,
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201
        created = r.json()

        # Verify doctor fields
        assert created["full_name"] == "Dr. Smith"
        assert created["specialty"] == "Cardiology"
        assert created["experience_years"] == 15
        assert created["bio"] == "Senior cardiologist"
        assert created["phone"] == "+380501234568"
        assert created["consultation_duration"] == 30
        assert created["is_active"] is True
        assert "id" in created
        assert "user_id" in created
        assert "created_at" in created
        assert "updated_at" in created

        # Verify user was created with role=DOCTOR
        user = crud.get_user_by_email(session=db, email=email)
        assert user is not None
        assert user.role == UserRole.DOCTOR
        assert user.is_superuser is False
        assert str(user.id) == created["user_id"]

    def test_create_doctor_duplicate_email(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. Smith",
            "specialty": "Cardiology",
        }

        # First creation succeeds
        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201

        # Second creation with same email fails
        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 409
        assert r.json()["detail"] == "A user with this email already exists"

    def test_create_doctor_by_normal_user(
        self,
        client: TestClient,
        normal_user_token_headers: dict[str, str],
    ) -> None:
        doctor_data = {
            "email": random_email(),
            "password": random_lower_string(),
            "full_name": "Dr. Smith",
            "specialty": "Cardiology",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=normal_user_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 403
        assert r.json()["detail"] == "The user doesn't have enough privileges"

    def test_create_doctor_unauthenticated(
        self,
        client: TestClient,
    ) -> None:
        doctor_data = {
            "email": random_email(),
            "password": random_lower_string(),
            "full_name": "Dr. Smith",
            "specialty": "Cardiology",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            json=doctor_data,
        )
        # OAuth2PasswordBearer returns 401 when no token is provided
        assert r.status_code == 401

    def test_create_doctor_role_is_doctor(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Verify the created user has role=DOCTOR, not admin."""
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. Role Test",
            "specialty": "Neurology",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201

        user = crud.get_user_by_email(session=db, email=email)
        assert user is not None
        assert user.role == UserRole.DOCTOR
        assert user.is_superuser is False

    def test_create_doctor_linked_to_user(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Verify the doctor profile is correctly linked to the created user."""
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. Link Test",
            "specialty": "Pediatrics",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201
        doctor_id = r.json()["id"]

        # Fetch the doctor from DB and verify user relationship
        doctor = db.get(Doctor, uuid.UUID(doctor_id))
        assert doctor is not None
        assert doctor.user is not None
        assert doctor.user.email == email
        assert doctor.user.role == UserRole.DOCTOR

    def test_create_doctor_with_specialty_field(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Verify the canonical 'specialty' field is accepted and stored correctly."""
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. Specialty Test",
            "specialty": "THERAPIST",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201
        created = r.json()
        assert created["specialty"] == "THERAPIST"

        # Verify in database
        doctor = db.get(Doctor, uuid.UUID(created["id"]))
        assert doctor is not None
        assert doctor.specialty == "THERAPIST"

    def test_create_doctor_with_specialization_field(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Verify the legacy 'specialization' field is still accepted (backward compat)."""
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. Legacy Test",
            "specialization": "NEUROLOGY",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201
        created = r.json()
        assert created["specialty"] == "NEUROLOGY"

        # Verify in database
        doctor = db.get(Doctor, uuid.UUID(created["id"]))
        assert doctor is not None
        assert doctor.specialty == "NEUROLOGY"

    def test_create_doctor_specialty_preferred_over_specialization(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """When both 'specialty' and 'specialization' are provided, 'specialty' wins."""
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. Priority Test",
            "specialty": "CARDIOLOGY",
            "specialization": "NEUROLOGY",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201
        created = r.json()
        assert created["specialty"] == "CARDIOLOGY"

        # Verify in database
        doctor = db.get(Doctor, uuid.UUID(created["id"]))
        assert doctor is not None
        assert doctor.specialty == "CARDIOLOGY"

    def test_create_doctor_without_specialty(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Verify doctor can be created without specialty (NULL is allowed)."""
        email = random_email()
        password = random_lower_string()

        doctor_data = {
            "email": email,
            "password": password,
            "full_name": "Dr. No Specialty",
        }

        r = client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json=doctor_data,
        )
        assert r.status_code == 201
        created = r.json()
        assert created["specialty"] is None


class TestReadDoctors:
    def test_read_doctors_public(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        create_test_doctor(db, client, superuser_token_headers)

        r = client.get(f"{settings.API_V1_STR}/doctors/")
        assert r.status_code == 200
        data = r.json()
        assert "data" in data
        assert "count" in data
        assert data["count"] >= 1
        for doctor in data["data"]:
            assert doctor["is_active"] is True

    def test_read_doctors_public_explicit(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        create_test_doctor(db, client, superuser_token_headers)

        r = client.get(f"{settings.API_V1_STR}/doctors/public")
        assert r.status_code == 200
        data = r.json()
        assert "data" in data
        assert "count" in data
        assert data["count"] >= 1

    def test_read_doctors_pagination(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        create_test_doctor(db, client, superuser_token_headers)

        # Create a second doctor
        email2 = random_email()
        password2 = random_lower_string()
        client.post(
            f"{settings.API_V1_STR}/doctors/",
            headers=superuser_token_headers,
            json={
                "email": email2,
                "password": password2,
                "full_name": "Dr. Jones",
                "specialty": "Dermatology",
            },
        )

        r = client.get(f"{settings.API_V1_STR}/doctors/?limit=1")
        assert r.status_code == 200
        data = r.json()
        assert len(data["data"]) == 1
        assert data["count"] >= 2

    def test_read_doctor_by_id_authenticated(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        normal_user_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=normal_user_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["id"] == doctor_id
        assert r.json()["full_name"] == "Test Doctor"

    def test_read_doctor_by_id_unauthenticated(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        r = client.get(f"{settings.API_V1_STR}/doctors/{doctor_id}")
        assert r.status_code == 401

    def test_read_doctor_not_found(
        self,
        client: TestClient,
        normal_user_token_headers: dict[str, str],
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.get(
            f"{settings.API_V1_STR}/doctors/{fake_id}",
            headers=normal_user_token_headers,
        )
        assert r.status_code == 404
        assert r.json()["detail"] == "Doctor not found"


class TestUpdateDoctor:
    def test_update_doctor_success(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        update_data = {
            "full_name": "Dr. Updated",
            "experience_years": 20,
        }

        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 200
        updated = r.json()
        assert updated["full_name"] == "Dr. Updated"
        assert updated["experience_years"] == 20
        # Fields not in update should remain unchanged
        assert updated["specialty"] == "Cardiology"

    def test_update_doctor_not_found(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
    ) -> None:
        fake_id = str(uuid.uuid4())
        update_data = {"full_name": "Dr. Ghost"}

        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{fake_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 404
        assert r.json()["detail"] == "Doctor not found"

    def test_update_doctor_by_normal_user(
        self,
        client: TestClient,
        normal_user_token_headers: dict[str, str],
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        update_data = {"full_name": "Dr. Hacker"}

        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=normal_user_token_headers,
            json=update_data,
        )
        assert r.status_code == 403

    def test_update_doctor_unauthenticated(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        update_data = {"full_name": "Dr. Ghost"}

        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            json=update_data,
        )
        assert r.status_code == 401


class TestDeleteDoctor:
    def test_delete_doctor_success(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["message"] == "Doctor deleted successfully"

        # Verify doctor is gone
        db_doctor = db.get(Doctor, uuid.UUID(doctor_id))
        assert db_doctor is None

        # Verify user still exists (delete does NOT remove user)
        user = crud.get_user_by_email(session=db, email=doctor.get("email", ""))
        if user is None:
            # The doctor dict doesn't have email, so check via user_id
            user = db.get(User, uuid.UUID(doctor["user_id"]))
        assert user is not None

    def test_delete_doctor_not_found(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
    ) -> None:
        fake_id = str(uuid.uuid4())
        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{fake_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 404
        assert r.json()["detail"] == "Doctor not found"

    def test_delete_doctor_by_normal_user(
        self,
        client: TestClient,
        normal_user_token_headers: dict[str, str],
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=normal_user_token_headers,
        )
        assert r.status_code == 403

    def test_delete_doctor_unauthenticated(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
        )
        assert r.status_code == 401
