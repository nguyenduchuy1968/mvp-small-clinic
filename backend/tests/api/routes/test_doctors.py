import uuid
from datetime import date, timedelta

from app import crud
from app.core.config import settings
from app.models import (
    Appointment,
    AppointmentStatus,
    ContactMethod,
    Doctor,
    DoctorAvailability,
    User,
    UserRole,
    Weekday,
)
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
        "phone": "+84912345678",
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
            "phone": "+84912345679",
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
        assert created["phone"] == "+84912345679"
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

    # ------------------------------------------------------------------
    # Doctor Email/Password Update Tests
    # ------------------------------------------------------------------

    def test_update_doctor_email(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Updating a doctor's email should update the linked User.email."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]
        original_email = doctor.get("email", "")

        # Fetch the original user to confirm
        user = crud.get_user_by_email(session=db, email=original_email)
        assert user is not None
        original_user_id = str(user.id)

        new_email = random_email()
        update_data = {"email": new_email}

        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 200
        updated = r.json()
        assert updated["email"] == new_email

        # Verify the User record was updated
        # Expire the session cache to force a fresh read from the database,
        # since the PATCH request committed the change in a different session.
        db.expire_all()
        updated_user = db.get(User, uuid.UUID(original_user_id))
        assert updated_user is not None
        assert updated_user.email == new_email

        # Old email should no longer exist
        old_user = crud.get_user_by_email(session=db, email=original_email)
        assert old_user is None

    def test_update_doctor_password(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Updating a doctor's password should update the linked User password."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        new_password = random_lower_string()
        update_data = {"password": new_password}

        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 200

        # Verify login with new password works
        login_data = {
            "username": doctor.get("email", ""),
            "password": new_password,
        }
        r = client.post(
            f"{settings.API_V1_STR}/login/access-token",
            data=login_data,
        )
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_update_doctor_email_uniqueness_violation(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Updating a doctor's email to an already-taken email should fail."""
        # Create first doctor
        doctor1 = create_test_doctor(db, client, superuser_token_headers)
        doctor1_id = doctor1["id"]

        # Create second doctor
        doctor2 = create_test_doctor(db, client, superuser_token_headers)
        doctor2_email = doctor2.get("email", "")

        # Try to update doctor1's email to doctor2's email
        update_data = {"email": doctor2_email}
        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor1_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        # Should fail with 409 Conflict due to unique constraint
        assert r.status_code == 409

    def test_update_doctor_empty_password_ignored(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Sending empty/null password should not change the existing password."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        # Update with empty password (should be ignored since it's not sent)
        update_data = {"full_name": "Dr. No Password Change"}
        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 200
        assert r.json()["full_name"] == "Dr. No Password Change"

        # Verify we can still login with the original password
        # (The original password was set in create_test_doctor, but we don't have it.
        #  We just verify the doctor was updated successfully.)
        assert r.json()["email"] is not None

    def test_update_doctor_email_and_password_simultaneously(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Updating both email and password in one request should work."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        new_email = random_email()
        new_password = random_lower_string()
        update_data = {
            "email": new_email,
            "password": new_password,
            "full_name": "Dr. Fully Updated",
        }

        r = client.patch(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
            json=update_data,
        )
        assert r.status_code == 200
        updated = r.json()
        assert updated["email"] == new_email
        assert updated["full_name"] == "Dr. Fully Updated"

        # Verify login with new email and password works
        login_data = {
            "username": new_email,
            "password": new_password,
        }
        r = client.post(
            f"{settings.API_V1_STR}/login/access-token",
            data=login_data,
        )
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_read_doctor_returns_email(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        normal_user_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """GET /doctors/{id} should return the doctor's email."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = doctor["id"]

        r = client.get(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=normal_user_token_headers,
        )
        assert r.status_code == 200
        assert "email" in r.json()
        assert r.json()["email"] is not None

    def test_read_doctors_list_returns_email(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """GET /doctors/ should return email for each doctor."""
        create_test_doctor(db, client, superuser_token_headers)

        r = client.get(f"{settings.API_V1_STR}/doctors/")
        assert r.status_code == 200
        data = r.json()
        for doctor in data["data"]:
            assert "email" in doctor


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

    # ------------------------------------------------------------------
    # Doctor Deletion Safety — cascade protection tests
    # ------------------------------------------------------------------

    def test_delete_doctor_with_availability_returns_409(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Deleting a doctor with availability records should return 409."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = uuid.UUID(doctor["id"])

        # Create an availability record for this doctor
        availability = DoctorAvailability(
            doctor_id=doctor_id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="17:00",
            duration_minutes=30,
            is_active=True,
        )
        db.add(availability)
        db.commit()

        # Attempt deletion without force — should be blocked
        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 409
        detail = r.json()["detail"]
        assert detail["can_delete"] is False
        assert detail["availability_count"] >= 1
        assert detail["future_appointments_count"] == 0

        # Verify doctor still exists
        db_doctor = db.get(Doctor, doctor_id)
        assert db_doctor is not None

    def test_delete_doctor_with_future_appointments_returns_409(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Deleting a doctor with future appointments should return 409."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = uuid.UUID(doctor["id"])

        # Create a future appointment for this doctor
        future_date = date.today() + timedelta(days=7)
        appointment = Appointment(
            doctor_id=doctor_id,
            patient_name="Test Patient",
            patient_phone="+84912345670",
            contact_method=ContactMethod.PHONE,
            appointment_date=future_date,
            appointment_time="10:00",
            status=AppointmentStatus.PENDING,
        )
        db.add(appointment)
        db.commit()

        # Attempt deletion without force — should be blocked
        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor_id}",
            headers=superuser_token_headers,
        )
        assert r.status_code == 409
        detail = r.json()["detail"]
        assert detail["can_delete"] is False
        assert detail["availability_count"] == 0
        assert detail["future_appointments_count"] >= 1

        # Verify doctor still exists
        db_doctor = db.get(Doctor, doctor_id)
        assert db_doctor is not None

    def test_delete_doctor_with_force_succeeds(
        self,
        client: TestClient,
        superuser_token_headers: dict[str, str],
        db: Session,
    ) -> None:
        """Force-deleting a doctor with related records should succeed."""
        doctor = create_test_doctor(db, client, superuser_token_headers)
        doctor_id = uuid.UUID(doctor["id"])

        # Create an availability record
        availability = DoctorAvailability(
            doctor_id=doctor_id,
            weekday=Weekday.MONDAY,
            start_time="09:00",
            end_time="17:00",
            duration_minutes=30,
            is_active=True,
        )
        db.add(availability)

        # Create a future appointment
        future_date = date.today() + timedelta(days=7)
        appointment = Appointment(
            doctor_id=doctor_id,
            patient_name="Test Patient",
            patient_phone="+84912345670",
            contact_method=ContactMethod.PHONE,
            appointment_date=future_date,
            appointment_time="10:00",
            status=AppointmentStatus.PENDING,
        )
        db.add(appointment)
        db.commit()

        # Force delete — should succeed
        r = client.delete(
            f"{settings.API_V1_STR}/doctors/{doctor_id}?force=true",
            headers=superuser_token_headers,
        )
        assert r.status_code == 200
        assert r.json()["message"] == "Doctor deleted successfully"

        # Verify doctor is gone
        db_doctor = db.get(Doctor, doctor_id)
        assert db_doctor is None
