"""Add Patient model and link appointments to patients.

This migration:

1. Creates the `patient` table with:
   - id (UUID, primary key)
   - user_id (nullable UUID, FK to user.id, unique, SET NULL on delete)
   - full_name (VARCHAR 255, NOT NULL)
   - phone (VARCHAR 20, nullable, indexed)
   - email (VARCHAR 255, nullable, indexed)
   - created_at / updated_at (timestamptz)
   - Unique constraints on phone and email for duplicate prevention

2. Adds `patient_id` column to the `appointment` table:
   - patient_id (nullable UUID, FK to patient.id, SET NULL on delete)
   - Indexed for query performance

3. Migrates existing appointment data:
   - For each unique (patient_name, patient_phone, patient_email) combination
     in the appointment table, creates a Patient record.
   - Links existing appointments to their corresponding Patient.

No data loss. All existing appointments retain their patient contact fields
(patient_name, patient_phone, patient_email) as denormalized snapshot data.

Revision ID: a1b2c3d4e5f6
Revises: e8f8789fb414
Create Date: 2026-06-27 19:50:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "e8f8789fb414"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # -----------------------------------------------------------------------
    # 1. Create patient table
    # -----------------------------------------------------------------------
    op.create_table(
        "patient",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True, unique=True),
        sa.Column(
            "full_name", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False
        ),
        sa.Column("phone", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone", name="uq_patient_phone"),
        sa.UniqueConstraint("email", name="uq_patient_email"),
    )
    op.create_index(op.f("ix_patient_phone"), "patient", ["phone"], unique=False)
    op.create_index(op.f("ix_patient_email"), "patient", ["email"], unique=False)

    # -----------------------------------------------------------------------
    # 2. Add patient_id column to appointment table
    # -----------------------------------------------------------------------
    op.add_column(
        "appointment",
        sa.Column("patient_id", sa.Uuid(), nullable=True),
    )
    op.create_index(
        op.f("ix_appointment_patient_id"),
        "appointment",
        ["patient_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_appointment_patient_id",
        "appointment",
        "patient",
        ["patient_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # -----------------------------------------------------------------------
    # 3. Migrate existing appointment data to Patient records
    #
    #    For each unique (patient_name, patient_phone, patient_email)
    #    combination in the appointment table, create a Patient record.
    #    Then update appointments to reference the correct patient_id.
    #
    #    This is a data migration that preserves all existing history.
    #
    #    Strategy: look up existing patient by email first, then by phone.
    #    If found, reuse that patient. If not found, insert a new one.
    #    This gracefully handles duplicate emails/phones in existing data.
    # -----------------------------------------------------------------------
    conn = op.get_bind()

    # Get all unique patient contact combinations from existing appointments
    result = conn.execute(sa.text("""
            SELECT DISTINCT
                patient_name,
                patient_phone,
                patient_email
            FROM appointment
            WHERE patient_name IS NOT NULL
        """)).fetchall()

    for row in result:
        patient_name, patient_phone, patient_email = row

        # Look up existing patient by email first, then by phone
        patient_id = None
        if patient_email:
            patient_id = conn.execute(
                sa.text("SELECT id FROM patient WHERE email = :email"),
                {"email": patient_email},
            ).scalar()
        if patient_id is None and patient_phone:
            patient_id = conn.execute(
                sa.text("SELECT id FROM patient WHERE phone = :phone"),
                {"phone": patient_phone},
            ).scalar()

        # If no existing patient found, insert a new one
        if patient_id is None:
            insert_result = conn.execute(
                sa.text("""
                    INSERT INTO patient (id, full_name, phone, email, created_at, updated_at)
                    VALUES (gen_random_uuid(), :name, :phone, :email, NOW(), NOW())
                    RETURNING id
                """),
                {"name": patient_name, "phone": patient_phone, "email": patient_email},
            )
            patient_id = insert_result.scalar()

        # Update all appointments with this patient contact combo to link to the new Patient
        conn.execute(
            sa.text("""
                UPDATE appointment
                SET patient_id = :patient_id
                WHERE patient_name = :name
                  AND patient_phone = :phone
                  AND patient_email IS NOT DISTINCT FROM :email
            """),
            {
                "patient_id": patient_id,
                "name": patient_name,
                "phone": patient_phone,
                "email": patient_email,
            },
        )


def downgrade() -> None:
    # Drop foreign key and index first
    op.drop_constraint("fk_appointment_patient_id", "appointment", type_="foreignkey")
    op.drop_index(op.f("ix_appointment_patient_id"), table_name="appointment")
    op.drop_column("appointment", "patient_id")

    # Drop patient table
    op.drop_index(op.f("ix_patient_phone"), table_name="patient")
    op.drop_index(op.f("ix_patient_email"), table_name="patient")
    op.drop_table("patient")
