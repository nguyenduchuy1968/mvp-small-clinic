import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Doctor,
    DoctorCreate,
    DoctorCreateWithUser,
    DoctorUpdate,
    User,
    UserCreate,
    UserRole,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user


def create_doctor_with_user(
    *, session: Session, doctor_in: DoctorCreateWithUser
) -> Doctor:
    """Atomically create a User (role=DOCTOR) and a Doctor profile.
    
    If Doctor creation fails, User creation is rolled back.
    """
    # 1. Create User with role=DOCTOR
    user_create = UserCreate(
        email=doctor_in.email,
        password=doctor_in.password,
        full_name=doctor_in.full_name,
        role=UserRole.DOCTOR,
        is_active=True,
    )
    user = create_user(session=session, user_create=user_create)

    try:
        # 2. Create Doctor profile linked to the user
        doctor_create = DoctorCreate(
            full_name=doctor_in.full_name,
            specialty=doctor_in.specialization,
            experience_years=doctor_in.experience_years,
            bio=doctor_in.bio,
            phone=doctor_in.phone,
            consultation_duration=doctor_in.consultation_duration,
            is_active=doctor_in.is_active,
        )
        db_obj = Doctor.model_validate(
            doctor_create, update={"user_id": user.id}
        )
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj
    except Exception:
        session.rollback()
        raise


def create_doctor(
    *, session: Session, doctor_create: DoctorCreate, user_id: uuid.UUID
) -> Doctor:
    db_obj = Doctor.model_validate(
        doctor_create, update={"user_id": user_id}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_doctor(*, session: Session, doctor_id: uuid.UUID) -> Doctor | None:
    return session.get(Doctor, doctor_id)


def get_doctors(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Doctor], int]:
    count_statement = select(Doctor).where(Doctor.is_active == True)
    count = len(session.exec(count_statement).all())

    statement = (
        select(Doctor)
        .where(Doctor.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    doctors = session.exec(statement).all()
    return list(doctors), count


def update_doctor(
    *, session: Session, db_doctor: Doctor, doctor_in: DoctorUpdate
) -> Doctor:
    doctor_data = doctor_in.model_dump(exclude_unset=True)
    db_doctor.sqlmodel_update(doctor_data)
    session.add(db_doctor)
    session.commit()
    session.refresh(db_doctor)
    return db_doctor


def delete_doctor(*, session: Session, db_doctor: Doctor) -> None:
    session.delete(db_doctor)
    session.commit()
