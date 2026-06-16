"""add_appointment_model

Revision ID: f06ca0465bf8
Revises: 3710c5cadb29
Create Date: 2026-06-16 06:57:51.520391

"""

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "f06ca0465bf8"
down_revision = "3710c5cadb29"
branch_labels = None
depends_on = None


def upgrade():
    # ### Create appointment table ###
    op.create_table(
        "appointment",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("doctor_id", sa.Uuid(), nullable=False),
        sa.Column(
            "patient_name", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False
        ),
        sa.Column(
            "patient_phone", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False
        ),
        sa.Column(
            "patient_email", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True
        ),
        sa.Column(
            "contact_method",
            sa.Enum(
                "phone",
                "email",
                "whatsapp",
                "viber",
                "zalo",
                "telegram",
                name="contactmethod",
                create_type=True,
            ),
            nullable=False,
            server_default="phone",
        ),
        sa.Column("appointment_date", sa.Date(), nullable=False),
        sa.Column(
            "appointment_time",
            sqlmodel.sql.sqltypes.AutoString(length=5),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "confirmed",
                "cancelled",
                name="appointmentstatus",
                create_type=True,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "notes", sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=True
        ),
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
            name="fk_appointment_doctor_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "doctor_id",
            "appointment_date",
            "appointment_time",
            name="uq_appointment_slot",
        ),
    )

    # ### Create indexes ###
    op.create_index(
        "ix_appointment_doctor_id",
        "appointment",
        ["doctor_id"],
    )
    op.create_index(
        "ix_appointment_appointment_date",
        "appointment",
        ["appointment_date"],
    )
    op.create_index(
        "ix_appointment_status",
        "appointment",
        ["status"],
    )


def downgrade():
    # ### Drop indexes ###
    op.drop_index("ix_appointment_status", table_name="appointment")
    op.drop_index("ix_appointment_appointment_date", table_name="appointment")
    op.drop_index("ix_appointment_doctor_id", table_name="appointment")

    # ### Drop unique constraint ###
    op.drop_constraint("uq_appointment_slot", "appointment", type_="unique")

    # ### Drop table ###
    op.drop_table("appointment")

    # ### Drop enum types ###
    sa.Enum(name="contactmethod").drop(op.get_bind())
    sa.Enum(name="appointmentstatus").drop(op.get_bind())
