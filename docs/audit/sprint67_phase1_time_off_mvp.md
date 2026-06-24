# Sprint 6.7 Phase 1 — Time Off MVP Architecture

## 1. Database Model

### 1.1 New Model: `DoctorTimeOff`

Add to [`backend/app/models.py`](../backend/app/models.py) alongside the existing `DoctorAvailability` model (line ~201):

```python
class DoctorTimeOffBase(SQLModel):
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=500)


class DoctorTimeOffCreate(DoctorTimeOffBase):
    pass


class DoctorTimeOffUpdate(DoctorTimeOffBase):
    start_date: date | None = None
    end_date: date | None = None
    reason: str | None = None


class DoctorTimeOff(DoctorTimeOffBase, table=True):
    __tablename__ = "doctor_time_off"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doctor_id: uuid.UUID = Field(
        foreign_key="doctor.id", nullable=False, ondelete="CASCADE",
        index=True,
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": get_datetime_utc},
    )
    doctor: Optional["Doctor"] = Relationship(back_populates="time_off_entries")


class DoctorTimeOffPublic(DoctorTimeOffBase):
    id: uuid.UUID
    doctor_id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DoctorTimeOffsPublic(SQLModel):
    data: list[DoctorTimeOffPublic]
    count: int
```

### 1.2 Doctor Model Update

Add relationship to [`Doctor`](../backend/app/models.py:116):

```python
class Doctor(DoctorBase, table=True):
    # ... existing fields ...
    time_off_entries: list["DoctorTimeOff"] = Relationship(
        back_populates="doctor",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
```

### 1.3 Validation Rules

| Rule                                                    | Enforcement                         | Error           |
| ------------------------------------------------------- | ----------------------------------- | --------------- |
| `start_date` must be ≤ `end_date`                       | CRUD layer                          | 400 Bad Request |
| `start_date` must not be in the past                    | CRUD layer                          | 400 Bad Request |
| `end_date` must not be more than 365 days in the future | CRUD layer (sanity limit)           | 400 Bad Request |
| `doctor_id` must reference an existing doctor           | CRUD layer                          | 404 Not Found   |
| Overlapping time-off periods are allowed                | No constraint — multiple reasons OK | N/A             |

### 1.4 Migration

New Alembic migration script to create `doctor_time_off` table:

```python
def upgrade():
    op.create_table(
        "doctor_time_off",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("doctor.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

def downgrade():
    op.drop_table("doctor_time_off")
```

---

## 2. API Design

### 2.1 Route File

New file: [`backend/app/api/routes/time_off.py`](../backend/app/api/routes/time_off.py)

Following the exact pattern of [`availability.py`](../backend/app/api/routes/availability.py).

### 2.2 Endpoints

| Method   | Path                            | Auth                 | Purpose                |
| -------- | ------------------------------- | -------------------- | ---------------------- |
| `GET`    | `/doctors/{doctor_id}/time-off` | Admin / Doctor (own) | List time-off periods  |
| `POST`   | `/doctors/{doctor_id}/time-off` | Admin / Doctor (own) | Create time-off period |
| `PATCH`  | `/time-off/{time_off_id}`       | Admin / Doctor (own) | Update time-off period |
| `DELETE` | `/time-off/{time_off_id}`       | Admin / Doctor (own) | Delete time-off period |

### 2.3 Permission Model

Same pattern as [`availability.py:_check_doctor_access`](../backend/app/api/routes/availability.py:48):

- **Admin** (`is_superuser=True` or `role=ADMIN`): Full access to all doctors' time-off records
- **Doctor** (`role=DOCTOR`): Can only manage their own time-off records
- **Public** (unauthenticated): No access to time-off CRUD

### 2.4 Response Models

All endpoints return [`DoctorTimeOffPublic`](#11-new-model-doctortimeoff) for single records or [`DoctorTimeOffsPublic`](#11-new-model-doctortimeoff) for lists.

### 2.5 Router Registration

In [`backend/app/main.py`](../backend/app/main.py), add:

```python
from app.api.routes import time_off
app.include_router(time_off.router, prefix=settings.API_V1_STR)
```

---

## 3. Validation Rules

### 3.1 CRUD Layer — `_validate_time_off_dates()`

```python
def _validate_time_off_dates(
    *,
    start_date: date,
    end_date: date,
) -> None:
    """Validate time-off date range.

    Rules:
    - start_date must be <= end_date
    - start_date must not be in the past
    - end_date must not be > 365 days in the future (sanity limit)

    Raises ValueError on validation failure.
    """
    if start_date > end_date:
        raise ValueError(
            f"start_date {start_date} must be on or before end_date {end_date}"
        )

    clinic_tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    today_local = datetime.now(clinic_tz).date()

    if start_date < today_local:
        raise ValueError(
            f"start_date {start_date} is in the past. Today is {today_local}."
        )

    max_future = today_local + timedelta(days=365)
    if end_date > max_future:
        raise ValueError(
            f"end_date {end_date} is more than 365 days in the future. "
            f"Maximum allowed: {max_future}."
        )
```

### 3.2 Slot Generator Integration

In [`slot_generator.py:generate_available_slots()`](../backend/app/slot_generator.py:63), add a new step **2.5** between loading intervals and generating slots:

```python
# 2.5. Check if doctor has time off on target_date
time_off_statement = select(DoctorTimeOff).where(
    DoctorTimeOff.doctor_id == doctor_id,
    DoctorTimeOff.start_date <= target_date,
    DoctorTimeOff.end_date >= target_date,
)
if session.exec(time_off_statement).first() is not None:
    return AvailableSlotsResponse(
        doctor_id=doctor_id,
        date=target_date,
        slots=[],
        count=0,
        reason="doctor_unavailable",
    )
```

This is placed **before** slot generation so that blocked dates return immediately with zero slots and `reason="doctor_unavailable"`.

### 3.3 Appointment Creation Validation

In [`crud.py:create_appointment()`](../backend/app/crud.py:875), add a new validation step **2.5** between date validation and availability window validation:

```python
# 2.5. Check if doctor has time off on this date
_validate_no_time_off(
    session=session,
    doctor_id=appointment_in.doctor_id,
    appointment_date=appointment_in.appointment_date,
)
```

The validation function:

```python
def _validate_no_time_off(
    *,
    session: Session,
    doctor_id: uuid.UUID,
    appointment_date: date,
) -> None:
    """Check if the doctor has time off on the given date.

    Raises ValueError if the date falls within any active time-off period.
    """
    statement = select(DoctorTimeOff).where(
        DoctorTimeOff.doctor_id == doctor_id,
        DoctorTimeOff.start_date <= appointment_date,
        DoctorTimeOff.end_date >= appointment_date,
    )
    if session.exec(statement).first() is not None:
        raise ValueError(
            f"Doctor {doctor_id} has time off on {appointment_date}. "
            f"Please select another date."
        )
```

### 3.4 Existing Bookings — No Change

Per the requirements: **Existing appointments remain unchanged.** No validation is added to check existing bookings when creating time off. The time-off period simply prevents new bookings.

---

## 4. Frontend Page Proposal

### 4.1 Page Structure

New route: `/doctors/{doctor_id}/time-off`

Following the pattern of the existing [`availability.tsx`](../frontend/src/routes/_layout/availability.tsx) page.

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│  Time Off  [Doctor Selector ▼]  [+ Add Time Off]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┬────────────┬──────────┬─────────┐ │
│  │ Start Date   │ End Date   │ Reason   │ Actions │ │
│  ├──────────────┼────────────┼──────────┼─────────┤ │
│  │ 2026-08-01   │ 2026-08-01 │ Personal │ ✏️ 🗑️  │ │
│  │ 2026-08-10   │ 2026-08-20 │ Vacation │ ✏️ 🗑️  │ │
│  └──────────────┴────────────┴──────────┴─────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component            | File                                                                                                                  | Purpose                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `TimeOffList`        | [`frontend/src/components/TimeOff/TimeOffList.tsx`](../frontend/src/components/TimeOff/TimeOffList.tsx)               | Table with DataTable, columns, actions menu     |
| `CreateTimeOff`      | [`frontend/src/components/TimeOff/CreateTimeOff.tsx`](../frontend/src/components/TimeOff/CreateTimeOff.tsx)           | Dialog with date range picker + reason textarea |
| `EditTimeOff`        | [`frontend/src/components/TimeOff/EditTimeOff.tsx`](../frontend/src/components/TimeOff/EditTimeOff.tsx)               | Dialog pre-filled with existing data            |
| `DeleteTimeOff`      | [`frontend/src/components/TimeOff/DeleteTimeOff.tsx`](../frontend/src/components/TimeOff/DeleteTimeOff.tsx)           | Confirmation dialog                             |
| `columns.tsx`        | [`frontend/src/components/TimeOff/columns.tsx`](../frontend/src/components/TimeOff/columns.tsx)                       | Table column definitions                        |
| `TimeOffActionsMenu` | [`frontend/src/components/TimeOff/TimeOffActionsMenu.tsx`](../frontend/src/components/TimeOff/TimeOffActionsMenu.tsx) | Edit/Delete dropdown                            |

### 4.3 Hooks

| Hook               | File                                                                                  | Purpose                          |
| ------------------ | ------------------------------------------------------------------------------------- | -------------------------------- |
| `useTimeOff`       | [`frontend/src/hooks/useTimeOff.ts`](../frontend/src/hooks/useTimeOff.ts)             | Query time-off list for a doctor |
| `useCreateTimeOff` | [`frontend/src/hooks/useCreateTimeOff.ts`](../frontend/src/hooks/useCreateTimeOff.ts) | Mutation to create time-off      |
| `useUpdateTimeOff` | [`frontend/src/hooks/useUpdateTimeOff.ts`](../frontend/src/hooks/useUpdateTimeOff.ts) | Mutation to update time-off      |
| `useDeleteTimeOff` | [`frontend/src/hooks/useDeleteTimeOff.ts`](../frontend/src/hooks/useDeleteTimeOff.ts) | Mutation to delete time-off      |

### 4.4 i18n Keys

New namespace: `timeOff` in [`frontend/src/i18n/locales/en/booking.json`](../frontend/src/i18n/locales/en/booking.json) (or a new `timeOff.json` file).

Keys needed:

- `page.title` — "Time Off"
- `page.noDoctor.title` — "Select a doctor to manage time off."
- `list.columns.startDate` — "Start Date"
- `list.columns.endDate` — "End Date"
- `list.columns.reason` — "Reason"
- `list.empty` — "No time off periods found."
- `create.title` — "Add Time Off"
- `create.submit` — "Create"
- `edit.title` — "Edit Time Off"
- `edit.submit` — "Save"
- `delete.title` — "Delete Time Off"
- `delete.confirmation` — "Are you sure you want to delete this time off period?"
- `form.startDate` — "Start Date"
- `form.endDate` — "End Date"
- `form.reason` — "Reason"
- `form.reasonPlaceholder` — "e.g., Vacation, Personal day..."
- `toast.createSuccess` — "Time off created successfully."
- `toast.updateSuccess` — "Time off updated successfully."
- `toast.deleteSuccess` — "Time off deleted successfully."

### 4.5 Navigation

Add a "Time Off" link in the sidebar navigation for admin users, alongside the existing "Availability" link.

### 4.6 Booking Wizard Integration (Future)

The booking wizard's [`DatePicker`](../frontend/src/components/Booking/DatePicker.tsx) should eventually show blocked dates visually. This is **out of scope for Phase 1** but should be noted for Phase 2.

---

## 5. Implementation Plan

### 5.1 File Change Summary

| #   | File                                                                                                  | Action  | Description                                                                            |
| --- | ----------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| 1   | [`backend/app/models.py`](../backend/app/models.py)                                                   | Modify  | Add `DoctorTimeOff` model + relationship on `Doctor`                                   |
| 2   | [`backend/app/crud.py`](../backend/app/crud.py)                                                       | Modify  | Add CRUD functions + `_validate_no_time_off()` + integrate into `create_appointment()` |
| 3   | [`backend/app/slot_generator.py`](../backend/app/slot_generator.py)                                   | Modify  | Add time-off check before slot generation                                              |
| 4   | [`backend/app/api/routes/time_off.py`](../backend/app/api/routes/time_off.py)                         | **New** | REST endpoints for time-off CRUD                                                       |
| 5   | [`backend/app/main.py`](../backend/app/main.py)                                                       | Modify  | Register time_off router                                                               |
| 6   | [`backend/app/alembic/versions/`](../backend/app/alembic/versions/)                                   | **New** | Migration script for `doctor_time_off` table                                           |
| 7   | [`frontend/src/routes/_layout/time-off.tsx`](../frontend/src/routes/_layout/time-off.tsx)             | **New** | Time Off page route                                                                    |
| 8   | [`frontend/src/components/TimeOff/`](../frontend/src/components/TimeOff/)                             | **New** | 6 component files                                                                      |
| 9   | [`frontend/src/hooks/useTimeOff.ts`](../frontend/src/hooks/useTimeOff.ts)                             | **New** | Query hook                                                                             |
| 10  | [`frontend/src/hooks/useCreateTimeOff.ts`](../frontend/src/hooks/useCreateTimeOff.ts)                 | **New** | Create mutation hook                                                                   |
| 11  | [`frontend/src/hooks/useUpdateTimeOff.ts`](../frontend/src/hooks/useUpdateTimeOff.ts)                 | **New** | Update mutation hook                                                                   |
| 12  | [`frontend/src/hooks/useDeleteTimeOff.ts`](../frontend/src/hooks/useDeleteTimeOff.ts)                 | **New** | Delete mutation hook                                                                   |
| 13  | [`frontend/src/i18n/locales/`](../frontend/src/i18n/locales/)                                         | Modify  | Add i18n keys for en/vi/uk                                                             |
| 14  | [`frontend/src/components/Sidebar/AppSidebar.tsx`](../frontend/src/components/Sidebar/AppSidebar.tsx) | Modify  | Add Time Off nav link                                                                  |
| 15  | [`frontend/src/routeTree.gen.ts`](../frontend/src/routeTree.gen.ts)                                   | Auto    | Regenerated by TanStack Router                                                         |

### 5.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TIME OFF MVP DATA FLOW                       │
│                                                                     │
│  Admin/Doctor                                                        │
│     │                                                                │
│     ├── POST /doctors/{id}/time-off  ──►  crud.create_doctor_time_off()
│     │                                       │                        │
│     │                                       ├── _validate_time_off_dates()
│     │                                       └── INSERT doctor_time_off
│     │                                                                │
│     ├── GET /doctors/{id}/time-off   ──►  crud.get_doctor_time_off()
│     │                                       └── SELECT ... WHERE doctor_id
│     │                                                                │
│     └── DELETE /time-off/{id}        ──►  crud.delete_doctor_time_off()
│                                             └── DELETE WHERE id
│                                                                     │
│  Patient (Booking Flow)                                              │
│     │                                                                │
│     └── GET /doctors/{id}/slots?date=YYYY-MM-DD                     │
│              │                                                       │
│              ▼                                                       │
│     slot_generator.generate_available_slots()                        │
│        │                                                            │
│        ├── 1. Lookup weekday                                         │
│        ├── 2. Load active DoctorAvailability intervals               │
│        ├── [NEW] 3. Check DoctorTimeOff for target_date              │
│        │       │                                                     │
│        │       ├── Blocked ──► return empty (reason="doctor_unavailable")
│        │       │                                                     │
│        │       ▼ (not blocked)                                       │
│        ├── 4. Generate slots                                         │
│        ├── 5. Remove booked slots                                    │
│        ├── 6. Filter past slots                                      │
│        └── 7. Return AvailableSlotsResponse                          │
│                                                                     │
│  Patient (Booking Creation)                                          │
│     │                                                                │
│     └── POST /appointments                                           │
│              │                                                       │
│              ▼                                                       │
│     crud.create_appointment()                                        │
│        │                                                            │
│        ├── 1. _validate_doctor_active()                              │
│        ├── 2. _validate_appointment_date()                           │
│        ├── [NEW] 3. _validate_no_time_off()                          │
│        │       │                                                     │
│        │       ├── Blocked ──► raise ValueError ──► HTTP 400        │
│        │       │                                                     │
│        │       ▼ (not blocked)                                       │
│        ├── 4. _validate_availability_window()                        │
│        ├── 5. _validate_contact_info()                               │
│        ├── 6. _check_double_booking()                                │
│        └── 7. INSERT appointment                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Key Design Decisions

1. **No `is_active` flag on `DoctorTimeOff`**: Per MVP requirements, time-off periods are always active. If a doctor needs to cancel time off, they delete the record. This simplifies the model and avoids the need for soft-delete logic.

2. **Overlapping time-off periods allowed**: A doctor might have multiple reasons for time off (e.g., "Vacation" + "Conference"). The slot generator checks if ANY active period covers the target date.

3. **Past dates rejected at creation**: You cannot create time off for dates already passed. This prevents accidental creation of historical records that would have no effect.

4. **365-day future limit**: Prevents creating time off years in advance, which would clutter the list and potentially cause confusion.

5. **No cascade to appointments**: Existing appointments are never modified by time-off creation or deletion. This is a hard requirement.

6. **Slot generator returns `reason="doctor_unavailable"`**: This reuses the existing reason string from [`AvailableSlotsResponse`](../backend/app/models.py:352), which the frontend already handles.

---

## 6. Summary

| Deliverable                | Files                         | Status          |
| -------------------------- | ----------------------------- | --------------- |
| Database model             | `models.py` + migration       | Design complete |
| CRUD functions             | `crud.py`                     | Design complete |
| Slot generator integration | `slot_generator.py`           | Design complete |
| Appointment validation     | `crud.py`                     | Design complete |
| API endpoints              | `time_off.py` + `main.py`     | Design complete |
| Frontend page              | `time-off.tsx` + 6 components | Design complete |
| Frontend hooks             | 4 hook files                  | Design complete |
| i18n                       | 3 locale files                | Design complete |
| Navigation                 | `AppSidebar.tsx`              | Design complete |
