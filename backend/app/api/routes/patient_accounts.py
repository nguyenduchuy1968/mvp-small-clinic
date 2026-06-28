"""Patient Account Activation endpoints.

This module handles the activation of online accounts for existing Patient records.
Patients may exist in the system without a User account (guest booking, reception-created).
This endpoint creates a User account and links it to the existing Patient.

Key design decisions:
- Never creates duplicate Patient records
- Patient is found by phone, then email is verified
- Patient.user_id must be NULL (not already activated)
- Returns JWT tokens so the patient is immediately logged in
"""

from datetime import timedelta
from typing import Any

from app import crud
from app.api.deps import SessionDep
from app.core import security
from app.core.config import settings
from app.models import (
    Patient,
    PatientAccountActivate,
    PatientAccountActivateResponse,
    PatientPublic,
    UserCreate,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

router = APIRouter(prefix="/patient-accounts", tags=["patient-accounts"])


@router.post("/activate", response_model=PatientAccountActivateResponse)
def activate_patient_account(
    *, session: SessionDep, body: PatientAccountActivate
) -> Any:
    """
    Activate an online account for an existing Patient record.

    Workflow:
    1. Validate passwords match.
    2. Find Patient by phone.
    3. Verify email matches the Patient record.
    4. Verify Patient.user_id IS NULL (not already activated).
    5. Create User with hashed password.
    6. Link Patient.user_id = User.id.
    7. Return JWT tokens and Patient summary.

    Never creates a duplicate Patient record.
    """
    # 1. Validate passwords match
    if body.password != body.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match",
        )

    # 2. Find Patient by phone
    patient = crud.find_patient_by_phone(session=session, phone=body.phone)
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found with this phone number",
        )

    # 3. Verify email matches
    if patient.email and patient.email.lower() != body.email.lower():
        raise HTTPException(
            status_code=400,
            detail="Email does not match the patient record",
        )

    # 4. Verify Patient.user_id IS NULL (not already activated)
    if patient.user_id is not None:
        raise HTTPException(
            status_code=400,
            detail="This patient account is already activated",
        )

    # 5. Create User with hashed password
    existing_user = crud.get_user_by_email(session=session, email=body.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists",
        )

    user_in = UserCreate(
        email=body.email,
        password=body.password,
        full_name=patient.full_name,
    )
    user = crud.create_user(session=session, user_create=user_in)

    # 6. Link Patient.user_id = User.id
    crud.link_patient_to_user(session=session, patient=patient, user=user)

    # 7. Generate JWT token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(user.id, expires_delta=access_token_expires)

    # Build patient summary
    patient_public = PatientPublic(
        id=patient.id,
        full_name=patient.full_name,
        phone=patient.phone,
        email=patient.email,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
    )

    return PatientAccountActivateResponse(
        access_token=token,
        token_type="bearer",
        patient=patient_public,
    )
