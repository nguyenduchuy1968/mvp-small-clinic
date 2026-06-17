"""Test database utilities.

This module provides test-database-specific engine creation and management.
It lives entirely in the tests layer — production code never imports it.

Key functions:
    create_test_engine() - Build a SQLModel engine pointing to app_test
    create_database_if_not_exists() - Auto-create app_test if missing
    run_migrations() - Create all tables in the test database
    verify_test_database() - Safety guard against running tests on app
"""

import logging

from sqlmodel import Session, create_engine, text

from app.core.config import settings

logger = logging.getLogger(__name__)


def create_test_engine():
    """Create a dedicated engine for the test database (app_test).

    Uses settings.SQLALCHEMY_TEST_DATABASE_URI which reads POSTGRES_DB_TEST
    from the environment (default: "app_test").
    """
    return create_engine(str(settings.SQLALCHEMY_TEST_DATABASE_URI))


def create_database_if_not_exists() -> None:
    """Create the test database (app_test) if it does not already exist.

    Connects to the default 'postgres' database with AUTOCOMMIT isolation,
    checks for the existence of app_test via pg_database, and issues
    CREATE DATABASE if missing.

    This is safe to call multiple times — it is idempotent.
    """
    admin_engine = create_engine(
        str(settings.SQLALCHEMY_DATABASE_URI).rsplit("/", 1)[0] + "/postgres",
        isolation_level="AUTOCOMMIT",
    )
    with admin_engine.connect() as conn:
        result = conn.execute(
            text(
                f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB_TEST}'"
            )
        )
        if not result.scalar():
            conn.execute(text(f'CREATE DATABASE "{settings.POSTGRES_DB_TEST}"'))
            logger.info("Created test database: %s", settings.POSTGRES_DB_TEST)
    admin_engine.dispose()


def run_migrations() -> None:
    """Create all tables in the test database using SQLModel metadata.

    Uses SQLModel.metadata.create_all() which reads the model definitions
    directly — no Alembic patching needed.

    Must be called after create_database_if_not_exists().
    """
    from sqlmodel import SQLModel

    engine = create_test_engine()
    SQLModel.metadata.create_all(engine)
    engine.dispose()
    logger.info("Created all tables in test database via SQLModel metadata")


def verify_test_database(engine) -> str:
    """Safety guard: verify the engine is connected to a test database.

    Queries current_database() and asserts the name contains '_test'.
    Raises AssertionError if connected to a non-test database (e.g. 'app').

    Returns the database name on success.
    """
    with Session(engine) as session:
        row = session.exec(text("SELECT current_database()")).one()
        # SQLModel/SQLAlchemy returns a Row object; extract first column value
        db_name = str(row[0])
        assert "_test" in db_name, (
            f"CRITICAL: Tests are connected to '{db_name}' which is NOT a test database! "
            "Aborting to protect development data."
        )
    print(f"Test database verified: {db_name}")
    return db_name
