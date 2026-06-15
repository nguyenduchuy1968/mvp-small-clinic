import uuid
from typing import Any

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models import (
    Doctor,
    DoctorCreate,
    DoctorCreateWithUser,
    DoctorPublic,
    DoctorsPublic,
    DoctorUpdate,
    Message,
    User,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import func, select

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get(
    "/",
    response_model=DoctorsPublic,
)
def read_doctors(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve active doctors. Public endpoint.
    """
    count_statement = (
        select(func.count()).select_from(Doctor).where(Doctor.is_active == True)
    )
    count = session.exec(count_statement).one()

    statement = select(Doctor).where(Doctor.is_active == True).offset(skip).limit(limit)
    doctors = session.exec(statement).all()

    doctors_public = [DoctorPublic.model_validate(doc) for doc in doctors]
    return DoctorsPublic(data=doctors_public, count=count)


@router.get(
    "/public",
    response_model=DoctorsPublic,
)
def read_doctors_public(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve active doctors. Public endpoint (explicit alias).
    """
    count_statement = (
        select(func.count()).select_from(Doctor).where(Doctor.is_active == True)
    )
    count = session.exec(count_statement).one()

    statement = select(Doctor).where(Doctor.is_active == True).offset(skip).limit(limit)
    doctors = session.exec(statement).all()

    doctors_public = [DoctorPublic.model_validate(doc) for doc in doctors]
    return DoctorsPublic(data=doctors_public, count=count)


@router.get(
    "/{doctor_id}",
    response_model=DoctorPublic,
)
def read_doctor(
    doctor_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get a specific doctor by ID. Requires authentication.
    """
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=DoctorPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_doctor(
    *,
    session: SessionDep,
    doctor_in: DoctorCreateWithUser,
) -> Any:
    """
    Create a new doctor with automatic user creation.

    This is the primary doctor onboarding endpoint.
    Automatically creates a User (role=DOCTOR) and a Doctor profile
    in a single atomic operation. The admin never needs to provide a user_id.

    The operation is transactional: if Doctor creation fails,
    the User creation is rolled back.
    """
    # Check for duplicate email
    existing_user = crud.get_user_by_email(
        session=session, email=doctor_in.email
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    doctor = crud.create_doctor_with_user(
        session=session, doctor_in=doctor_in
    )
    return doctor


@router.post(
    "/with-user-id",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=DoctorPublic,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_doctor_with_user_id(
    *,
    session: SessionDep,
    doctor_in: DoctorCreate,
    user_id: uuid.UUID,
) -> Any:
    """
    [Internal] Create a doctor profile linked to an existing user.
    Requires user_id. Hidden from public API docs.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    existing_doctor = session.exec(
        select(Doctor).where(Doctor.user_id == user_id)
    ).first()
    if existing_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A doctor profile already exists for this user",
        )

    doctor = crud.create_doctor(
        session=session, doctor_create=doctor_in, user_id=user_id
    )
    return doctor


@router.patch(
    "/{doctor_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=DoctorPublic,
)
def update_doctor(
    *,
    session: SessionDep,
    doctor_id: uuid.UUID,
    doctor_in: DoctorUpdate,
) -> Any:
    """
    Update a doctor profile. Admin only.
    """
    db_doctor = session.get(Doctor, doctor_id)
    if not db_doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    doctor = crud.update_doctor(
        session=session, db_doctor=db_doctor, doctor_in=doctor_in
    )
    return doctor


@router.delete(
    "/{doctor_id}",
    dependencies=[Depends(get_current_active_superuser)],
)
def delete_doctor(
    *,
    session: SessionDep,
    doctor_id: uuid.UUID,
) -> Message:
    """
    Delete a doctor profile. Admin only.
    """
    db_doctor = session.get(Doctor, doctor_id)
    if not db_doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    crud.delete_doctor(session=session, db_doctor=db_doctor)
    return Message(message="Doctor deleted successfully")
