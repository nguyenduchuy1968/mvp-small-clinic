# Sprint 6.7 Phase 1 — Blocked Dates MVP

## Architecture Decision

**Approach:** `BlockedDate` (single-date rows) as specified in [`docs/03_DATABASE.md`](../docs/03_DATABASE.md:104).

**Rejected:** `DoctorTimeOff` (date-range model) — over-engineered for 1–2 doctor MVP.

---

## 1. Database Model

### New model: `BlockedDate`

Add to [`backend/app/models.py`](../backend/app/models.py) alongside existing models.

```python
class BlockedDateBase(SQLModel):
    blocked_date: date
    reason: str | None = Field(default=None, max_length=500)


class BlockedDateCreate(SQLModel):
    dates: list[date]
    reason: str | None = Field(default=None, max_length=500)


class BlockedDate(BlockedDateBase, table=True):
    __tablename__ = "blocked_dates"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doctor_id: uuid.UUID = Field(
        foreign_key="doctor.id", nullable=False, ondelete="CASCADE",
        index=True,
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    doctor: Optional["Doctor"] = Relationship(back_populates="blocked_dates")

    __table_args__ = (
        sa.UniqueConstraint(
            "doctor_id", "blocked_date",
            name="uq_blocked_date_per_doctor",
        ),
    )


class BlockedDatePublic(BlockedDateBase):
    id: uuid.UUID
    doctor_id: uuid.UUID
    created_at: datetime | None = None


class BlockedDatesPublic(SQLModel):
    data: list[BlockedDatePublic]
    count: int
```

### Doctor model update

Add relationship to [`Doctor`](../backend/app/models.py:116):

```python
class Doctor(DoctorBase, table=True):
    # ... existing fields ...
    blocked_dates: list["BlockedDate"] = Relationship(
        back_populates="doctor",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
```

### Migration

New Alembic migration:

```python
def upgrade():
    op.create_table(
        "blocked_dates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("doctor.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("blocked_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("doctor_id", "blocked_date",
                            name="uq_blocked_date_per_doctor"),
    )

def downgrade():
    op.drop_table("blocked_dates")
```

---

## 2. CRUD Functions

Add to [`backend/app/crud.py`](../backend/app/crud.py).

### `create_blocked_dates()`

```python
def create_blocked_dates(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    dates: list[date],
    reason: str | None = None,
) -> list[BlockedDate]:
    """Create blocked date records for a doctor.

    Accepts multiple dates, creates one row per date.
    Validates:
    - Doctor exists
    - Each date is >= today (clinic local time)
    - No duplicates for same doctor (caught by unique constraint)

    Raises ValueError on validation failure.
    Catches IntegrityError for duplicate dates and raises ValueError.
    """
    # 1. Verify doctor exists
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise ValueError(f"Doctor with id {doctor_id} not found")

    # 2. Validate dates
    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    today_local = datetime.now(clinic_tz).date()

    for d in dates:
        if d < today_local:
            raise ValueError(
                f"Blocked date {d} is in the past. Today is {today_local}."
            )

    # 3. Create records
    created: list[BlockedDate] = []
    try:
        for d in dates:
            db_obj = BlockedDate(
                doctor_id=doctor_id,
                blocked_date=d,
                reason=reason,
            )
            session.add(db_obj)
            created.append(db_obj)
        session.commit()
        for obj in created:
            session.refresh(obj)
    except IntegrityError as exc:
        session.rollback()
        if "uq_blocked_date_per_doctor" in str(exc):
            raise ValueError(
                f"One or more dates are already blocked for doctor {doctor_id}."
            )
        raise

    return created
```

### `get_blocked_dates()`

```python
def get_blocked_dates(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[BlockedDate], int]:
    """Get all blocked dates for a doctor, ordered by date ascending."""
    count_statement = select(BlockedDate).where(
        BlockedDate.doctor_id == doctor_id,
    )
    count = len(session.exec(count_statement).all())

    statement = (
        select(BlockedDate)
        .where(BlockedDate.doctor_id == doctor_id)
        .order_by(BlockedDate.blocked_date.asc())
        .offset(skip)
        .limit(limit)
    )
    records = session.exec(statement).all()
    return list(records), count
```

### `delete_blocked_date()`

```python
def delete_blocked_date(
    *,
    session: Session,
    blocked_date_id: uuid.UUID,
) -> None:
    """Delete a blocked date record."""
    db_obj = session.get(BlockedDate, blocked_date_id)
    if not db_obj:
        raise ValueError(f"Blocked date with id {blocked_date_id} not found")
    session.delete(db_obj)
    session.commit()
```

### `_validate_not_blocked_date()`

```python
def _validate_not_blocked_date(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    appointment_date: date,
) -> None:
    """Check if the appointment date is blocked for the doctor.

    Raises ValueError if the date is blocked.
    """
    statement = select(BlockedDate).where(
        BlockedDate.doctor_id == doctor_id,
        BlockedDate.blocked_date == appointment_date,
    )
    if session.exec(statement).first() is not None:
        raise ValueError(
            f"Doctor is unavailable on {appointment_date}. "
            f"Please select another date."
        )
```

### Integration into `create_appointment()`

Add step **2.5** between date validation and availability window validation:

```python
# 2.5. Check if appointment date is blocked
_validate_not_blocked_date(
    session=session,
    doctor_id=appointment_in.doctor_id,
    appointment_date=appointment_in.appointment_date,
)
```

---

## 3. API Endpoints

New file: [`backend/app/api/routes/blocked_dates.py`](../backend/app/api/routes/blocked_dates.py)

Following the exact pattern of [`availability.py`](../backend/app/api/routes/availability.py).

### Endpoints

| Method   | Path                                 | Auth                 | Purpose                 |
| -------- | ------------------------------------ | -------------------- | ----------------------- |
| `GET`    | `/doctors/{doctor_id}/blocked-dates` | Admin / Doctor (own) | List blocked dates      |
| `POST`   | `/doctors/{doctor_id}/blocked-dates` | Admin / Doctor (own) | Block one or more dates |
| `DELETE` | `/blocked-dates/{blocked_date_id}`   | Admin / Doctor (own) | Unblock a date          |

### Permission helpers

Reuse the same pattern from [`availability.py`](../backend/app/api/routes/availability.py:48):

```python
def _check_doctor_access(*, current_user: User, doctor_id: uuid.UUID) -> None:
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return
    if current_user.doctor is None or current_user.doctor.id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
```

### POST request/response

**Request:**

```json
{
  "dates": ["2026-08-01", "2026-08-02", "2026-08-03"],
  "reason": "Vacation"
}
```

**Response (201 Created):**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "doctor_id": "uuid-doctor",
      "blocked_date": "2026-08-01",
      "reason": "Vacation",
      "created_at": "2026-06-24T..."
    },
    {
      "id": "uuid-2",
      "doctor_id": "uuid-doctor",
      "blocked_date": "2026-08-02",
      "reason": "Vacation",
      "created_at": "2026-06-24T..."
    },
    {
      "id": "uuid-3",
      "doctor_id": "uuid-doctor",
      "blocked_date": "2026-08-03",
      "reason": "Vacation",
      "created_at": "2026-06-24T..."
    }
  ],
  "count": 3
}
```

### Error responses

| Scenario                 | Status | Body                                                                         |
| ------------------------ | ------ | ---------------------------------------------------------------------------- |
| Date in the past         | 400    | `{"detail": "Blocked date 2026-01-01 is in the past. Today is 2026-06-24."}` |
| Duplicate date           | 409    | `{"detail": "One or more dates are already blocked for doctor {id}."}`       |
| Doctor not found         | 404    | `{"detail": "Doctor with id {id} not found"}`                                |
| Blocked date not found   | 404    | `{"detail": "Blocked date with id {id} not found"}`                          |
| Forbidden (wrong doctor) | 403    | `{"detail": "The user doesn't have enough privileges"}`                      |

### Router registration

In [`backend/app/main.py`](../backend/app/main.py):

```python
from app.api.routes import blocked_dates
app.include_router(blocked_dates.router, prefix=settings.API_V1_STR)
```

---

## 4. Slot Generator Integration

In [`slot_generator.py:generate_available_slots()`](../backend/app/slot_generator.py:63), add step **2.5** between loading intervals and generating slots:

```python
# 2.5. Check if target_date is blocked for this doctor
blocked_statement = select(BlockedDate).where(
    BlockedDate.doctor_id == doctor_id,
    BlockedDate.blocked_date == target_date,
)
if session.exec(blocked_statement).first() is not None:
    return AvailableSlotsResponse(
        doctor_id=doctor_id,
        date=target_date,
        slots=[],
        count=0,
        reason="doctor_unavailable",
    )
```

This reuses the existing `reason="doctor_unavailable"` string from [`AvailableSlotsResponse`](../backend/app/models.py:352), which the frontend already handles.

---

## 5. Validation Rules

| Rule                                        | Enforcement          | Error           |
| ------------------------------------------- | -------------------- | --------------- |
| `blocked_date` >= today (clinic local time) | CRUD layer           | 400 Bad Request |
| Duplicate `(doctor_id, blocked_date)`       | DB unique constraint | 409 Conflict    |
| `doctor_id` must reference existing doctor  | CRUD layer           | 404 Not Found   |

**Removed (per spec):**

- 365-day future limit — not needed for MVP
- Overlapping logic — not applicable (single-date rows)
- Range entities — not implementing

---

## 6. Testing

### Test file: [`backend/tests/crud/test_blocked_dates.py`](../backend/tests/crud/test_blocked_dates.py)

| Test                                     | Description                                                         |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `test_create_single_blocked_date`        | Create one blocked date, verify it exists                           |
| `test_create_multiple_blocked_dates`     | Create 3 dates in one call, verify all created                      |
| `test_create_duplicate_blocked_date`     | Same date twice → 409 Conflict                                      |
| `test_create_past_date_rejected`         | Date before today → 400 Bad Request                                 |
| `test_get_blocked_dates`                 | List blocked dates, verify ordering                                 |
| `test_delete_blocked_date`               | Delete a blocked date, verify removed                               |
| `test_delete_nonexistent_blocked_date`   | Delete non-existent ID → 404                                        |
| `test_blocked_date_slot_generation`      | Blocked date returns empty slots with `reason="doctor_unavailable"` |
| `test_blocked_date_appointment_rejected` | Create appointment on blocked date → 400                            |
| `test_existing_appointment_unchanged`    | Existing appointment on date that becomes blocked remains unchanged |
| `test_admin_can_access_any_doctor`       | Admin creates/reads/deletes for any doctor                          |
| `test_doctor_can_access_own_records`     | Doctor manages own blocked dates                                    |
| `test_doctor_cannot_access_other_doctor` | Doctor cannot manage another doctor's blocked dates                 |

### Test file: [`backend/tests/api/routes/test_blocked_dates.py`](../backend/tests/api/routes/test_blocked_dates.py)

API-level tests for the same scenarios, verifying HTTP status codes and response bodies.

---

## 7. File Change Summary

| #   | File                                                                                                  | Action  | Description                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| 1   | [`backend/app/models.py`](../backend/app/models.py)                                                   | Modify  | Add `BlockedDate` model + relationship on `Doctor`                                          |
| 2   | [`backend/app/crud.py`](../backend/app/crud.py)                                                       | Modify  | Add CRUD functions + `_validate_not_blocked_date()` + integrate into `create_appointment()` |
| 3   | [`backend/app/slot_generator.py`](../backend/app/slot_generator.py)                                   | Modify  | Add blocked date check before slot generation                                               |
| 4   | [`backend/app/api/routes/blocked_dates.py`](../backend/app/api/routes/blocked_dates.py)               | **New** | REST endpoints for blocked dates CRUD                                                       |
| 5   | [`backend/app/main.py`](../backend/app/main.py)                                                       | Modify  | Register blocked_dates router                                                               |
| 6   | [`backend/app/alembic/versions/`](../backend/app/alembic/versions/)                                   | **New** | Migration script for `blocked_dates` table                                                  |
| 7   | [`backend/tests/crud/test_blocked_dates.py`](../backend/tests/crud/test_blocked_dates.py)             | **New** | CRUD-level tests                                                                            |
| 8   | [`backend/tests/api/routes/test_blocked_dates.py`](../backend/tests/api/routes/test_blocked_dates.py) | **New** | API-level tests                                                                             |

---

## 8. Success Criteria

| Criterion                                             | Verification                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| ✓ Doctor can block a day                              | `POST /doctors/{id}/blocked-dates` with single date                                     |
| ✓ Doctor can block multiple days                      | `POST /doctors/{id}/blocked-dates` with date array                                      |
| ✓ Blocked dates do not generate slots                 | `GET /doctors/{id}/slots?date=YYYY-MM-DD` returns empty + `reason="doctor_unavailable"` |
| ✓ New appointments cannot be created on blocked dates | `POST /appointments` on blocked date → HTTP 400                                         |
| ✓ Existing appointments remain unchanged              | No code modifies existing appointments                                                  |
| ✓ No over-engineering                                 | Single-date rows, no ranges, no notifications, no conflicts                             |
| ✓ Matches project specification                       | `blocked_dates` table as defined in [`docs/03_DATABASE.md`](../docs/03_DATABASE.md:104) |
