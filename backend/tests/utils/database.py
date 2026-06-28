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

    Drops all existing tables first, then recreates them from the current
    SQLModel model definitions. This ensures the test schema always matches
    the model definitions — including columns that were added after the
    test database was first created.

    Also creates PostgreSQL sequences that are managed by Alembic migrations
    (e.g. booking_number_seq) since SQLModel metadata does not handle sequences.

    Must be called after create_database_if_not_exists().
    """
    from sqlmodel import SQLModel, text

    # Drop all existing tables first, then recreate from current model definitions.
    # This is necessary because SQLModel.metadata.create_all() is idempotent:
    # it creates missing tables but NEVER adds missing columns to existing tables.
    engine = create_test_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    # Create PostgreSQL sequences that Alembic migrations would normally create
    with engine.connect() as conn:
        # Check if booking_number_seq exists; create if not
        result = conn.execute(
            text("SELECT 1 FROM pg_sequences WHERE sequencename = 'booking_number_seq'")
        )
        if not result.scalar():
            conn.execute(text("CREATE SEQUENCE booking_number_seq START 1"))
            conn.commit()
            logger.info("Created booking_number_seq sequence")

    engine.dispose()
    logger.info("Recreated all tables in test database via SQLModel metadata")


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
