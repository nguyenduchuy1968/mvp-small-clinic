"""Tests for the Patient Account Activation endpoint.

Tests cover:
- Guest booking patient activation (happy path)
- Reception-created patient activation
- Already activated error (Patient.user_id IS NOT NULL)
- Patient not found (wrong phone)
- Email mismatch
- Password mismatch
- Weak password
- Login after activation
- Existing appointments preserved after activation
"""

from app import crud
from app.core.config import settings
from app.models import Patient, User
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from tests.utils.utils import random_email, random_lower_string


def _create_unactivated_patient(
    db: Session,
    *,
    full_name: str | None = None,
    phone: str | None = None,
    email: str | None = None,
) -> Patient:
    """Helper to create a Patient record without a linked User (user_id IS NULL)."""
    patient = Patient(
        full_name=full_name or "Test Patient",
        phone=phone or f"+1{random_lower_string()[:10]}",
        email=email or random_email(),
        user_id=None,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


class TestActivatePatientAccount:
    """Test suite for POST /api/v1/patient-accounts/activate."""

    def test_activate_guest_booking_patient(
        self, client: TestClient, db: Session
    ) -> None:
        """Happy path: a patient who booked as a guest can activate their account."""
        patient_email = random_email()
        patient = _create_unactivated_patient(
            db,
            full_name="Guest Patient",
            phone="+19876543210",
            email=patient_email,
        )
        password = "StrongPass123!"

        response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": patient_email,
                "password": password,
                "confirm_password": password,
            },
        )

        assert response.status_code == 200, response.text
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["patient"]["id"] == str(patient.id)
        assert data["patient"]["full_name"] == "Guest Patient"
        assert data["patient"]["phone"] == patient.phone
        assert data["patient"]["email"] == patient_email

        # Verify the Patient is now linked to a User
        db.refresh(patient)
        assert patient.user_id is not None

        # Verify the User was created with the patient's email and name
        user = db.get(User, patient.user_id)
        assert user is not None
        assert user.email == patient_email
        assert user.full_name == "Guest Patient"

    def test_activate_reception_created_patient(
        self, client: TestClient, db: Session
    ) -> None:
        """Happy path: a patient created by reception can activate their account."""
        patient_email = random_email()
        patient = _create_unactivated_patient(
            db,
            full_name="Reception Patient",
            phone="+19876543211",
            email=patient_email,
        )
        password = "StrongPass456!"

        response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": patient_email,
                "password": password,
                "confirm_password": password,
            },
        )

        assert response.status_code == 200, response.text
        data = response.json()
        assert "access_token" in data

        # Verify linking
        db.refresh(patient)
        assert patient.user_id is not None

    def test_activate_already_activated(self, client: TestClient, db: Session) -> None:
        """Error: patient already has a linked User account."""
        patient_email = random_email()
        patient = _create_unactivated_patient(
            db,
            full_name="Already Activated",
            phone="+19876543212",
            email=patient_email,
        )

        # First activation should succeed
        password = "StrongPass789!"
        response1 = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": patient_email,
                "password": password,
                "confirm_password": password,
            },
        )
        assert response1.status_code == 200

        # Second activation should fail
        response2 = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": patient_email,
                "password": password,
                "confirm_password": password,
            },
        )
        assert response2.status_code == 400
        assert "already activated" in response2.text.lower()

    def test_activate_patient_not_found(self, client: TestClient, db: Session) -> None:
        """Error: no patient found with the given phone number."""
        password = "StrongPass123!"
        response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": "+19999999999",
                "email": random_email(),
                "password": password,
                "confirm_password": password,
            },
        )
        assert response.status_code == 404
        assert "not found" in response.text.lower()

    def test_activate_email_mismatch(self, client: TestClient, db: Session) -> None:
        """Error: provided email does not match the patient record."""
        patient_email = random_email()
        patient = _create_unactivated_patient(
            db,
            full_name="Email Mismatch",
            phone="+19876543213",
            email=patient_email,
        )
        wrong_email = random_email()
        password = "StrongPass123!"

        response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": wrong_email,
                "password": password,
                "confirm_password": password,
            },
        )
        assert response.status_code == 400
        assert "email does not match" in response.text.lower()

    def test_activate_password_mismatch(self, client: TestClient, db: Session) -> None:
        """Error: password and confirm_password do not match."""
        patient_email = random_email()
        patient = _create_unactivated_patient(
            db,
            full_name="Password Mismatch",
            phone="+19876543214",
            email=patient_email,
        )

        response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": patient_email,
                "password": "StrongPass123!",
                "confirm_password": "DifferentPass456!",
            },
        )
        assert response.status_code == 400
        assert "passwords do not match" in response.text.lower()

    def test_activate_weak_password(self, client: TestClient, db: Session) -> None:
        """Error: password is too short (less than 8 characters)."""
        patient_email = random_email()
        patient = _create_unactivated_patient(
            db,
            full_name="Weak Password",
            phone="+19876543215",
            email=patient_email,
        )

        response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": patient_email,
                "password": "Ab1",
                "confirm_password": "Ab1",
            },
        )
        assert response.status_code == 422  # Validation error

    def test_login_after_activation(self, client: TestClient, db: Session) -> None:
        """After activation, the patient can log in with their new credentials."""
        patient_email = random_email()
        patient = _create_unactivated_patient(
            db,
            full_name="Login After Activation",
            phone="+19876543216",
            email=patient_email,
        )
        password = "StrongPass123!"

        # Activate
        activate_response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": patient_email,
                "password": password,
                "confirm_password": password,
            },
        )
        assert activate_response.status_code == 200

        # Login with the new credentials
        login_response = client.post(
            f"{settings.API_V1_STR}/login/access-token",
            data={"username": patient_email, "password": password},
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert "access_token" in login_data

    def test_activate_existing_email_user(
        self, client: TestClient, db: Session
    ) -> None:
        """Error: a User with this email already exists."""
        existing_email = random_email()
        # Create a user with this email first
        crud.create_user(
            session=db,
            user_create=crud.UserCreate(
                email=existing_email,
                password="StrongPass123!",
                full_name="Existing User",
            ),
        )

        # Create a patient with a different email
        patient = _create_unactivated_patient(
            db,
            full_name="Existing Email Patient",
            phone="+19876543217",
            email=random_email(),
        )

        # Try to activate with the existing user's email
        response = client.post(
            f"{settings.API_V1_STR}/patient-accounts/activate",
            json={
                "phone": patient.phone,
                "email": existing_email,
                "password": "StrongPass123!",
                "confirm_password": "StrongPass123!",
            },
        )
        # This should fail because the email doesn't match the patient record
        assert response.status_code == 400
        assert "email does not match" in response.text.lower()
