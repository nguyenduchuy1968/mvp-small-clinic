"""Replace uq_appointment_slot with partial unique index for active bookings.

The previous UNIQUE constraint on (doctor_id, appointment_date, appointment_time)
prevented any two rows from having the same slot, regardless of status. This meant
a CANCELLED appointment physically occupied the slot, preventing re-booking.

This migration:
1. Drops the UNIQUE constraint uq_appointment_slot
2. Creates a partial unique index uq_appointment_slot_active that only applies
   to rows with status IN ('pending', 'confirmed')

This allows CANCELLED appointments to coexist at the same slot while still
preventing double-booking of active appointments (race condition protection).

Revision ID: c8d4e5f6a7b8
Revises: b7a3c9d4e5f6
Create Date: 2026-06-22 12:20:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c8d4e5f6a7b8"
down_revision: str | None = "b7a3c9d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Drop the status-agnostic unique constraint
    op.drop_constraint("uq_appointment_slot", "appointment", type_="unique")

    # Create a partial unique index that only applies to active bookings
    # This allows CANCELLED rows at the same slot while preventing
    # double-booking of PENDING or CONFIRMED appointments
    op.create_index(
        "uq_appointment_slot_active",
        "appointment",
        ["doctor_id", "appointment_date", "appointment_time"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'confirmed')"),
    )


def downgrade() -> None:
    # Drop the partial unique index
    op.drop_index(
        "uq_appointment_slot_active",
        table_name="appointment",
        postgresql_where=sa.text("status IN ('pending', 'confirmed')"),
    )

    # Restore the original status-agnostic unique constraint
    op.create_unique_constraint(
        "uq_appointment_slot",
        "appointment",
        ["doctor_id", "appointment_date", "appointment_time"],
    )
