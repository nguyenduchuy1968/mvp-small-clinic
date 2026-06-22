"""add_booking_number_to_appointment

Revision ID: b7a3c9d4e5f6
Revises: f06ca0465bf8
Create Date: 2026-06-22 14:00:00.000000

"""

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "b7a3c9d4e5f6"
down_revision = "f06ca0465bf8"
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create the booking number sequence
    op.execute("CREATE SEQUENCE booking_number_seq START 1")

    # 2. Add booking_number column (nullable initially for backfill)
    op.add_column(
        "appointment",
        sa.Column(
            "booking_number",
            sqlmodel.sql.sqltypes.AutoString(length=30),
            nullable=True,
        ),
    )

    # 3. Backfill existing appointments with sequential booking numbers
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT id FROM appointment ORDER BY created_at, id"))
    seq = 1
    for row in result:
        bn = f"BK-{seq:06d}"
        conn.execute(
            sa.text("UPDATE appointment SET booking_number = :bn WHERE id = :id"),
            {"bn": bn, "id": row[0]},
        )
        seq += 1

    # 4. Set NOT NULL after backfill
    op.alter_column("appointment", "booking_number", nullable=False)

    # 5. Add unique constraint and index
    op.create_unique_constraint(
        "uq_appointment_booking_number", "appointment", ["booking_number"]
    )
    op.create_index("ix_appointment_booking_number", "appointment", ["booking_number"])


def downgrade():
    op.drop_index("ix_appointment_booking_number", table_name="appointment")
    op.drop_constraint("uq_appointment_booking_number", "appointment")
    op.drop_column("appointment", "booking_number")
    op.execute("DROP SEQUENCE IF EXISTS booking_number_seq")
