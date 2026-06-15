"""Add user role field and doctor model

Revision ID: 2a7b9c3d1e5f
Revises: fe56fa70289e
Create Date: 2026-06-14 08:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "2a7b9c3d1e5f"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None


def upgrade():
    # Add role column to user table with default 'doctor'
    op.add_column(
        "user",
        sa.Column(
            "role",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default="doctor",
        ),
    )

    # Create doctor table
    op.create_table(
        "doctor",
        sa.Column(
            "full_name", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False
        ),
        sa.Column(
            "specialty", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True
        ),
        sa.Column("experience_years", sa.Integer(), nullable=True),
        sa.Column("bio", sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=True),
        sa.Column(
            "photo_url", sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # Drop orphan item table (no longer has a corresponding model)
    op.drop_table("item")


def downgrade():
    # Recreate item table for downgrade
    op.create_table(
        "item",
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.drop_table("doctor")
    op.drop_column("user", "role")
