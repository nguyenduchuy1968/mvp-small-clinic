"""add_doctor_availability_model

Revision ID: 3710c5cadb29
Revises: c2eb11e4d7d7
Create Date: 2026-06-15 18:20:16.766786

"""

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "3710c5cadb29"
down_revision = "c2eb11e4d7d7"
branch_labels = None
depends_on = None


def upgrade():
    # ### Create doctor_availability table ###
    op.create_table(
        "doctor_availability",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "weekday",
            sa.Enum(
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
                name="weekday",
                create_type=True,
            ),
            nullable=False,
        ),
        sa.Column(
            "start_time", sqlmodel.sql.sqltypes.AutoString(length=5), nullable=False
        ),
        sa.Column(
            "end_time", sqlmodel.sql.sqltypes.AutoString(length=5), nullable=False
        ),
        sa.Column(
            "duration_minutes", sa.Integer(), nullable=False, server_default="30"
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("doctor_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["doctor_id"],
            ["doctor.id"],
            name="fk_doctor_availability_doctor_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # ### Create index on doctor_id ###
    op.create_index(
        "ix_doctor_availability_doctor_id",
        "doctor_availability",
        ["doctor_id"],
    )

    # ### Create unique constraint to prevent duplicate intervals ###
    op.create_unique_constraint(
        "uq_doctor_availability_interval",
        "doctor_availability",
        ["doctor_id", "weekday", "start_time", "end_time"],
    )

    # ### Add check constraint: end_time > start_time ###
    op.create_check_constraint(
        "ck_doctor_availability_end_after_start",
        "doctor_availability",
        sa.text("end_time > start_time"),
    )


def downgrade():
    # ### Drop check constraint ###
    op.drop_constraint(
        "ck_doctor_availability_end_after_start",
        "doctor_availability",
        type_="check",
    )

    # ### Drop unique constraint ###
    op.drop_constraint(
        "uq_doctor_availability_interval",
        "doctor_availability",
        type_="unique",
    )

    # ### Drop index ###
    op.drop_index("ix_doctor_availability_doctor_id", table_name="doctor_availability")

    # ### Drop table ###
    op.drop_table("doctor_availability")

    # ### Drop Weekday enum type ###
    sa.Enum(name="weekday").drop(op.get_bind())
