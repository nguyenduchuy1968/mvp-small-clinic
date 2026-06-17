from collections.abc import Generator

import pytest
from app.core.config import settings
from app.core.db import init_db
from app.main import app
from app.models import Appointment, Doctor, DoctorAvailability, User
from fastapi.testclient import TestClient
from sqlmodel import Session, delete
from tests.utils.database import (
    create_database_if_not_exists,
    create_test_engine,
    run_migrations,
    verify_test_database,
)
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers

# ---------------------------------------------------------------------------
# Test database setup (runs once at module load, before any fixtures)
# ---------------------------------------------------------------------------

# Auto-create app_test if it does not exist
create_database_if_not_exists()

# Create all tables in app_test via SQLModel metadata
run_migrations()

# Create a dedicated engine pointing to app_test (never the dev app database)
test_engine = create_test_engine()

# Safety guard: crash immediately if we are connected to the wrong database
verify_test_database(test_engine)

# ---------------------------------------------------------------------------
# Override FastAPI dependency to use test engine
# ---------------------------------------------------------------------------

from app.api import deps


def get_test_db() -> Generator[Session, None, None]:
    """Override get_db to use the test engine instead of the dev engine."""
    with Session(test_engine) as session:
        yield session


# Replace the production get_db dependency with our test version
app.dependency_overrides[deps.get_db] = get_test_db

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(test_engine) as session:
        init_db(session)
        yield session
        # Delete in FK order: appointments -> availability -> doctors -> users
        session.execute(delete(Appointment))
        session.execute(delete(DoctorAvailability))
        session.execute(delete(Doctor))
        session.execute(delete(User))
        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
