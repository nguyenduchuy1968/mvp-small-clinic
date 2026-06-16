# Sprint 4 — Step 1: Appointment Booking — Architecture & Database Design

> **Status:** Architecture & Design (No Implementation)
> **Goal:** Design the Appointment Booking foundation — model, relationships, validation rules, slot generation strategy.
> **Constraint:** MVP only. No Payments, Medical Records, Prescriptions, Reviews, Favorites, or CRM.

---

## 1. Business Goals

| Actor                                   | Goal                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| **Patient** (unauthenticated)           | Browse doctors → view available slots → select slot → create appointment |
| **Doctor** (authenticated, role=DOCTOR) | View own appointments → confirm/cancel appointments                      |
| **Admin** (authenticated, role=ADMIN)   | View all appointments → manage any appointment                           |

---

## 2. Existing Foundation (Reused)

The following components are already built and will be reused:

| Component                                         | File              | Purpose                                                                      |
| ------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| [`Doctor`](backend/app/models.py:99)              | `models.py`       | Doctor profile                                                               |
| [`DoctorAvailability`](backend/app/models.py:155) | `models.py`       | Weekly recurring intervals (weekday, start_time, end_time, duration_minutes) |
| [`Weekday`](backend/app/models.py:120)            | `models.py`       | Enum: MONDAY..SUNDAY                                                         |
| Doctor CRUD                                       | `crud.py`         | `get_doctor()`, `get_doctors()`                                              |
| Availability CRUD                                 | `crud.py`         | `get_doctor_availability()`, overlap detection                               |
| Availability API                                  | `availability.py` | GET/POST/PATCH/DELETE endpoints                                              |
| Auth system                                       | `deps.py`         | `CurrentUser`, `SessionDep`, role-based access                               |
| User model                                        | `models.py`       | `User` with `role` field (ADMIN, DOCTOR)                                     |

---

## 3. Architecture Review Findings

### Review Area 1: `appointment.duration_minutes`

**Question:** Is `duration_minutes` on the Appointment table necessary?

**Finding:** No. It creates a second source of truth.

**Reasoning:**

- `DoctorAvailability.duration_minutes` already defines the slot length for each interval.
- At booking time, the slot is generated from an availability interval — the duration is known.
- Storing `duration_minutes` on the appointment would need to be validated against the availability interval, creating duplication.
- If the doctor later changes `duration_minutes` on an availability interval, existing appointments would have a different duration than the current setting — this is confusing.

**Decision: REMOVE `duration_minutes` from Appointment.**

The appointment's duration is implicitly defined by the availability interval it was booked against. The slot generation algorithm determines the duration at booking time, and the appointment stores only the start time. The end time can be calculated as `appointment_time + DoctorAvailability.duration_minutes` when needed.

### Review Area 2: `Doctor.consultation_duration`

**Question:** Is `Doctor.consultation_duration` still required?

**Finding:** No. It creates a second source of truth for slot duration.

**Reasoning:**

- `DoctorAvailability.duration_minutes` already exists and is the natural place to define slot length per interval.
- Having `Doctor.consultation_duration` as a fallback adds complexity: "use doctor-level duration, fall back to interval duration, fall back to 30min default."
- A doctor may want different durations for different intervals (e.g., 30min for regular checkups, 60min for consultations). Per-interval `duration_minutes` supports this naturally.
- Removing `Doctor.consultation_duration` simplifies the slot generation algorithm to a single source of truth.

**Decision: REMOVE `Doctor.consultation_duration`.** The field already exists in the database from Sprint 2, but it will be deprecated (not used by slot generation). Slot generation relies solely on `DoctorAvailability.duration_minutes`.

**Migration note:** The column already exists in the `doctor` table. No migration is needed to remove it — it simply won't be used by the appointment system. It can be removed in a future cleanup migration.

### Review Area 3: `contact_method`

**Question:** Should a lightweight `contact_method` field be added now?

**Finding:** Yes — but only as a simple enum, no channel-specific IDs.

**Reasoning:**

- MVP Principle #6: "Future messaging integrations should be possible without redesigning the appointment table."
- Without `contact_method`, the system has no way to know the patient's preferred channel.
- Adding it now is a single enum field — zero complexity.
- Adding it later requires a database migration and retrofitting existing records.
- It does NOT add channel-specific fields (no `whatsapp_id`, `telegram_id`, etc.) — those belong in a future notification service.

**Decision: ADD `contact_method` as an optional enum field.**

```python
class ContactMethod(str, enum.Enum):
    PHONE = "phone"      # SMS/call
    EMAIL = "email"      # Email
    WHATSAPP = "whatsapp"
    VIBER = "viber"
    ZALO = "zalo"
    TELEGRAM = "telegram"
```

Default: `PHONE` (most accessible, no app required).

---

## 4. Final Appointment Model Design

### 4.1 Database Table: `appointment`

```python
class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"      # Created, awaiting confirmation
    CONFIRMED = "confirmed"  # Confirmed by doctor/admin
    CANCELLED = "cancelled"  # Cancelled by anyone


class ContactMethod(str, enum.Enum):
    PHONE = "phone"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    VIBER = "viber"
    ZALO = "zalo"
    TELEGRAM = "telegram"


class AppointmentBase(SQLModel):
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id", nullable=False, index=True)
    patient_name: str = Field(max_length=255)
    patient_phone: str = Field(max_length=20)
    patient_email: str | None = Field(default=None, max_length=255)
    contact_method: ContactMethod = Field(default=ContactMethod.PHONE)
    appointment_date: date        # The date of the appointment (YYYY-MM-DD)
    appointment_time: str         # HH:MM format, e.g. "09:00"
    status: AppointmentStatus = Field(default=AppointmentStatus.PENDING)
    notes: str | None = Field(default=None, max_length=2000)


class Appointment(AppointmentBase, table=True):
    __tablename__ = "appointment"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": get_datetime_utc},
    )

    # Relationships
    doctor: Optional["Doctor"] = Relationship(back_populates="appointments")
```

### 4.2 Fields Summary

| Field              | Type                  | Notes                                                   |
| ------------------ | --------------------- | ------------------------------------------------------- |
| `id`               | UUID (PK)             | Auto-generated                                          |
| `doctor_id`        | UUID (FK → doctor.id) | Indexed, CASCADE delete                                 |
| `patient_name`     | str(255)              | Required                                                |
| `patient_phone`    | str(20)               | Required                                                |
| `patient_email`    | str(255)              | Optional                                                |
| `contact_method`   | enum                  | PHONE (default), EMAIL, WHATSAPP, VIBER, ZALO, TELEGRAM |
| `appointment_date` | date                  | The calendar date                                       |
| `appointment_time` | str(5)                | HH:MM format                                            |
| `status`           | enum                  | PENDING → CONFIRMED or CANCELLED                        |
| `notes`            | str(2000)             | Optional                                                |
| `created_at`       | datetime(tz)          | Auto                                                    |
| `updated_at`       | datetime(tz)          | Auto on update                                          |

**Key change from v1:** `duration_minutes` removed. Duration is derived from `DoctorAvailability.duration_minutes` at booking time.

### 4.3 Constraints

```sql
-- Prevent double-booking: same doctor, same date, same time slot
UNIQUE (doctor_id, appointment_date, appointment_time)
```

This ensures no two appointments can exist for the same doctor at the same date/time.

---

## 5. Relationships

```
Doctor (1) ──── (N) DoctorAvailability
Doctor (1) ──── (N) Appointment
```

- **Doctor → Appointment**: One-to-many. A doctor has many appointments.
- **Appointment → Doctor**: Many-to-one. Each appointment belongs to one doctor.
- **Doctor → DoctorAvailability**: Already exists (one-to-many).

### Relationship Code

Add to [`Doctor`](backend/app/models.py:99):

```python
class Doctor(DoctorBase, table=True):
    # ... existing fields ...
    appointments: list["Appointment"] = Relationship(
        back_populates="doctor",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
```

---

## 6. Appointment Statuses & State Machine

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
        ┌─────────────┐        ┌─────────────┐
        │  CONFIRMED  │        │  CANCELLED  │
        └─────────────┘        └─────────────┘
```

| Status      | Meaning                                    | Who Can Set                                        |
| ----------- | ------------------------------------------ | -------------------------------------------------- |
| `PENDING`   | Appointment created, awaiting confirmation | Patient (create), Doctor/Admin                     |
| `CONFIRMED` | Appointment confirmed                      | Doctor, Admin                                      |
| `CANCELLED` | Appointment cancelled                      | Patient (via cancellation endpoint), Doctor, Admin |

**Rules:**

- `PENDING` → `CONFIRMED`: Doctor or Admin confirms.
- `PENDING` → `CANCELLED`: Anyone can cancel.
- `CONFIRMED` → `CANCELLED`: Doctor or Admin can cancel.
- `CONFIRMED` → `PENDING`: Not allowed (must cancel and rebook).
- `CANCELLED` → anything: Not allowed (terminal state).

---

## 7. Validation Rules

### 7.1 Slot Availability Validation

| Rule                       | Description                                                                                        | Error                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Doctor exists**          | `doctor_id` must reference an active doctor                                                        | `404 Doctor not found`                      |
| **Doctor is active**       | `doctor.is_active == True`                                                                         | `422 Doctor is not active`                  |
| **Date is not past**       | `appointment_date >= today`                                                                        | `422 Cannot book past dates`                |
| **Time is not past**       | If `appointment_date == today`, then `appointment_time > now`                                      | `422 Cannot book past time`                 |
| **Within availability**    | The `(weekday, start_time, end_time)` must cover `(appointment_time, appointment_time + duration)` | `422 Slot is outside doctor's availability` |
| **Availability is active** | The matched `DoctorAvailability.is_active == True`                                                 | `422 Availability is not active`            |
| **No double booking**      | No existing appointment with same `doctor_id + date + time` where status != CANCELLED              | `409 Time slot already booked`              |
| **Touching allowed**       | Appointments can end exactly when another starts (e.g., 09:00-09:30 and 09:30-10:00)               | Allowed                                     |

### 7.2 Appointment Management Validation

| Rule                        | Description                             | Error                           |
| --------------------------- | --------------------------------------- | ------------------------------- |
| **Appointment exists**      | Must reference a valid appointment      | `404 Appointment not found`     |
| **Doctor owns appointment** | Doctor can only manage own appointments | `403 Not enough permissions`    |
| **Status transition valid** | Must follow state machine               | `422 Invalid status transition` |

---

## 8. Slot Generation Strategy

### 8.1 Algorithm

Given a doctor's availability intervals, generate bookable slots for a specific date:

```
Input:
  - doctor_id
  - date (e.g., 2026-06-20)

Step 1: Determine weekday from date (e.g., 2026-06-20 is SATURDAY)

Step 2: Query active availability for that doctor + weekday
  SELECT * FROM doctor_availability
  WHERE doctor_id = :doctor_id
    AND weekday = :weekday
    AND is_active = TRUE

Step 3: For each matching interval, generate slots:
  duration = interval.duration_minutes
  slot_start = interval.start_time
  while slot_start + duration <= interval.end_time:
    slot = {
      date: date,
      time: slot_start,
      end_time: slot_start + duration,
      duration_minutes: duration,
      available: not double_booked
    }
    slot_start += duration

Step 4: Filter out slots that are already booked (status != CANCELLED)

Step 5: Return remaining available slots
```

### 8.2 Duration Resolution (Simplified)

The slot duration is determined by a **single source of truth**:

```
DoctorAvailability.duration_minutes
```

**Why this is simpler:**

- No fallback chain to resolve.
- Each availability interval can have its own duration (e.g., 30min for mornings, 60min for afternoons).
- The doctor sets duration per interval, not globally.
- No `Doctor.consultation_duration` field is consulted — it is deprecated.

### 8.3 Example

**Doctor A** has:

- Availability: MONDAY 09:00-12:00 (duration_minutes=30)

**Available slots for Monday 2026-06-22:**

```
09:00 - 09:30  ✓
09:30 - 10:00  ✓
10:00 - 10:30  ✓
10:30 - 11:00  ✓
11:00 - 11:30  ✓
11:30 - 12:00  ✓
```

If `09:30-10:00` is already booked:

```
09:00 - 09:30  ✓
09:30 - 10:00  ✗ (booked)
10:00 - 10:30  ✓
10:30 - 11:00  ✓
11:00 - 11:30  ✓
11:30 - 12:00  ✓
```

---

## 9. API Endpoints (Design Only — No Implementation)

### 9.1 Public Endpoints (No Auth)

| Method | Path                                                | Purpose                                         |
| ------ | --------------------------------------------------- | ----------------------------------------------- |
| `GET`  | `/api/v1/doctors/{doctor_id}/slots?date=2026-06-20` | Get available time slots for a doctor on a date |

### 9.2 Patient Endpoints (No Auth Required)

| Method | Path                   | Purpose                                                        |
| ------ | ---------------------- | -------------------------------------------------------------- |
| `POST` | `/api/v1/appointments` | Create a new appointment (patient provides name, phone, email) |

### 9.3 Authenticated Endpoints (Doctor, Admin)

| Method   | Path                               | Purpose                                                   |
| -------- | ---------------------------------- | --------------------------------------------------------- |
| `GET`    | `/api/v1/appointments`             | List appointments (filterable by doctor_id, date, status) |
| `GET`    | `/api/v1/appointments/{id}`        | Get appointment details                                   |
| `PATCH`  | `/api/v1/appointments/{id}/status` | Update appointment status (confirm/cancel)                |
| `DELETE` | `/api/v1/appointments/{id}`        | Delete appointment (admin only)                           |

### 9.4 Permission Matrix

| Endpoint                          | Anonymous | Patient | Doctor   | Admin |
| --------------------------------- | --------- | ------- | -------- | ----- |
| `GET /slots`                      | ✅        | ✅      | ✅       | ✅    |
| `POST /appointments`              | ✅        | ✅      | ✅       | ✅    |
| `GET /appointments`               | ❌        | ❌      | Own only | All   |
| `GET /appointments/{id}`          | ❌        | ❌      | Own only | All   |
| `PATCH /appointments/{id}/status` | ❌        | ❌      | Own only | All   |
| `DELETE /appointments/{id}`       | ❌        | ❌      | ❌       | ✅    |

---

## 10. Request/Response Schemas (Design Only)

### 10.1 Create Appointment

```python
class AppointmentCreate(SQLModel):
    doctor_id: uuid.UUID
    patient_name: str = Field(max_length=255)
    patient_phone: str = Field(max_length=20)
    patient_email: str | None = Field(default=None, max_length=255)
    contact_method: ContactMethod = Field(default=ContactMethod.PHONE)
    appointment_date: date
    appointment_time: str = Field(max_length=5, regex=r"^([01]\d|2[0-3]):[0-5]\d$")
    notes: str | None = Field(default=None, max_length=2000)
```

### 10.2 Update Status

```python
class AppointmentStatusUpdate(SQLModel):
    status: AppointmentStatus  # CONFIRMED or CANCELLED
```

### 10.3 Response

```python
class AppointmentPublic(AppointmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AppointmentsPublic(SQLModel):
    data: list[AppointmentPublic]
    count: int
```

### 10.4 Slot Response

```python
class TimeSlot(SQLModel):
    date: date
    time: str          # e.g., "09:00"
    end_time: str      # e.g., "09:30"
    duration_minutes: int
    available: bool


class AvailableSlots(SQLModel):
    doctor_id: uuid.UUID
    date: date
    slots: list[TimeSlot]
```

---

## 11. CRUD Functions (Design Only)

```python
# --- Appointment CRUD ---

def create_appointment(
    *, session: Session, appointment_in: AppointmentCreate
) -> Appointment:
    """Create a new appointment with full validation."""
    # 1. Validate doctor exists and is active
    # 2. Validate date is not past
    # 3. Validate time is within availability (uses DoctorAvailability.duration_minutes)
    # 4. Validate no double booking
    # 5. Create appointment (no duration_minutes — derived from availability)
    pass


def get_appointment(
    *, session: Session, appointment_id: uuid.UUID
) -> Appointment | None:
    pass


def get_appointments(
    *, session: Session,
    doctor_id: uuid.UUID | None = None,
    appointment_date: date | None = None,
    status: AppointmentStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Appointment], int]:
    """List appointments with optional filters."""
    pass


def update_appointment_status(
    *, session: Session, db_appointment: Appointment,
    new_status: AppointmentStatus
) -> Appointment:
    """Update appointment status with state machine validation."""
    pass


def delete_appointment(
    *, session: Session, appointment_id: uuid.UUID
) -> None:
    pass


# --- Slot Generation ---

def get_available_slots(
    *, session: Session, doctor_id: uuid.UUID, date: date
) -> list[TimeSlot]:
    """Generate available time slots for a doctor on a given date."""
    # 1. Determine weekday
    # 2. Get active availability intervals
    # 3. Get existing appointments (non-cancelled)
    # 4. Generate slots using interval.duration_minutes, filter out booked ones
    pass
```

---

## 12. Future Compatibility

| Future Feature                      | How Current Design Supports It                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Patient accounts**                | `patient_email` can be linked to a `User` table later; add `patient_id` FK                                 |
| **Email notifications**             | `patient_email` already captured; `contact_method=EMAIL` signals preference                                |
| **SMS notifications**               | `patient_phone` already captured; `contact_method=PHONE` signals preference                                |
| **WhatsApp notifications**          | `patient_phone` already captured; `contact_method=WHATSAPP` signals preference                             |
| **Viber notifications**             | `patient_phone` already captured; `contact_method=VIBER` signals preference                                |
| **Zalo notifications**              | `patient_phone` already captured; `contact_method=ZALO` signals preference                                 |
| **Telegram notifications**          | `contact_method=TELEGRAM` signals preference (Telegram ID stored in future notification service, not here) |
| **Multi-channel fallback**          | `contact_method` is a single value; future enhancement could be a priority list                            |
| **Recurring appointments**          | `appointment_date` is a single date; recurring = create multiple                                           |
| **Multi-clinic**                    | Add `clinic_id` to Doctor; appointments inherit via doctor                                                 |
| **Online booking (patient portal)** | Public endpoints (`GET /slots`, `POST /appointments`) are already auth-free                                |
| **AI slot suggestion**              | Slot generation is a pure function of availability + existing bookings                                     |

---

## 13. Risks & Mitigations

| Risk                                                | Impact                                                                 | Mitigation                                                                                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Race condition on double booking**                | Two patients book the same slot simultaneously                         | Use DB unique constraint as final guard; application-level check is first line                                                                                      |
| **Time zone confusion**                             | Patient books wrong time                                               | Store all times in clinic local time (no TZ conversion in MVP). Document clearly.                                                                                   |
| **Doctor changes availability after patient books** | Existing appointments fall outside new availability                    | Appointments are immutable snapshots; changing availability does not affect existing appointments                                                                   |
| **Patient provides invalid phone/email**            | Cannot contact patient                                                 | Basic format validation on phone/email; no SMS/email sending in MVP                                                                                                 |
| **Overlapping availability intervals**              | Duplicate slots generated                                              | Slot generation deduplicates by time; unique constraint on appointment prevents double booking                                                                      |
| **Cascade delete removes appointments**             | Deleting a doctor removes all their appointments                       | This is intentional (CASCADE). Admin should deactivate doctor instead of deleting.                                                                                  |
| **Duration changes on availability interval**       | Existing appointments may have different duration than current setting | Appointments store only start time; duration is a property of the availability at booking time. If interval duration changes, existing appointments are unaffected. |

---

## 14. Recommendations for Sprint 4 — Step 2 (Implementation)

### Priority Order

1. **Models & Migration** — Add `AppointmentStatus`, `ContactMethod`, `Appointment` model, relationship on `Doctor`, create Alembic migration
2. **CRUD Layer** — Implement `create_appointment`, `get_appointment`, `get_appointments`, `update_appointment_status`, `delete_appointment`, `get_available_slots`
3. **Slot Generation** — Implement `get_available_slots()` with full validation (doctor active, date not past, within availability, no double booking). Duration comes from `DoctorAvailability.duration_minutes` only.
4. **API Endpoints** — Implement all endpoints in `backend/app/api/routes/appointments.py`
5. **Register Router** — Add to `backend/app/api/main.py`
6. **Tests** — CRUD tests + API tests + slot generation tests

### Key Implementation Details

- Use the same patterns as [`availability.py`](backend/app/api/routes/availability.py): `_get_appointment_or_404()`, `_check_doctor_access()`, `_check_appointment_access()`
- Reuse `SessionDep`, `CurrentUser`, `get_current_active_superuser` from [`deps.py`](backend/app/api/deps.py)
- Slot generation should be a pure CRUD function (no HTTP dependency), making it testable
- The unique constraint `(doctor_id, appointment_date, appointment_time)` is the **final guard** against double booking — always catch `IntegrityError` and convert to 409
- **Do NOT store `duration_minutes` on the Appointment model** — derive from `DoctorAvailability.duration_minutes`
- **Do NOT use `Doctor.consultation_duration`** — it is deprecated. Use `DoctorAvailability.duration_minutes` as the single source of truth.
- **DO add `contact_method`** — it's a single enum field that future-proofs messaging integration

### Files to Create/Modify

| Action     | File                                                                                                                                                                                                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modify** | [`backend/app/models.py`](backend/app/models.py) — Add `AppointmentStatus`, `ContactMethod`, `AppointmentBase`, `Appointment`, `AppointmentCreate`, `AppointmentStatusUpdate`, `AppointmentPublic`, `AppointmentsPublic`, `TimeSlot`, `AvailableSlots`; add `appointments` relationship to `Doctor` |
| **Modify** | [`backend/app/crud.py`](backend/app/crud.py) — Add appointment CRUD functions and slot generation                                                                                                                                                                                                   |
| **Create** | `backend/app/api/routes/appointments.py` — API endpoints                                                                                                                                                                                                                                            |
| **Modify** | [`backend/app/api/main.py`](backend/app/api/main.py) — Register appointments router                                                                                                                                                                                                                 |
| **Create** | Alembic migration for `appointment` table                                                                                                                                                                                                                                                           |
| **Create** | `backend/tests/crud/test_appointment.py` — CRUD tests                                                                                                                                                                                                                                               |
| **Create** | `backend/tests/api/routes/test_appointments.py` — API tests                                                                                                                                                                                                                                         |

---

## 15. Appendix: Slot Generation Example (Full Walkthrough)

### Scenario

**Doctor:** Dr. Smith

- Availability: MONDAY 09:00-12:00 (duration_minutes=30, active), MONDAY 14:00-17:00 (duration_minutes=30, active)
- Existing appointments on 2026-06-22 (Monday): 09:30-10:00 (CONFIRMED), 11:00-11:30 (PENDING)

**Request:** `GET /doctors/{id}/slots?date=2026-06-22`

**Step 1:** Determine weekday → MONDAY

**Step 2:** Query active availability for MONDAY:

- Interval 1: 09:00-12:00 (duration_minutes=30)
- Interval 2: 14:00-17:00 (duration_minutes=30)

**Step 3:** Generate slots for Interval 1 (09:00-12:00, step=30min):

```
09:00-09:30  → check booking: NOT booked → available ✓
09:30-10:00  → check booking: BOOKED → unavailable ✗
10:00-10:30  → check booking: NOT booked → available ✓
10:30-11:00  → check booking: NOT booked → available ✓
11:00-11:30  → check booking: BOOKED → unavailable ✗
11:30-12:00  → check booking: NOT booked → available ✓
```

**Step 4:** Generate slots for Interval 2 (14:00-17:00, step=30min):

```
14:00-14:30  → available ✓
14:30-15:00  → available ✓
15:00-15:30  → available ✓
15:30-16:00  → available ✓
16:00-16:30  → available ✓
16:30-17:00  → available ✓
```

**Step 5:** Return combined result:

```json
{
  "doctor_id": "...",
  "date": "2026-06-22",
  "slots": [
    {
      "date": "2026-06-22",
      "time": "09:00",
      "end_time": "09:30",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "10:00",
      "end_time": "10:30",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "10:30",
      "end_time": "11:00",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "11:30",
      "end_time": "12:00",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "14:00",
      "end_time": "14:30",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "14:30",
      "end_time": "15:00",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "15:00",
      "end_time": "15:30",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "15:30",
      "end_time": "16:00",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "16:00",
      "end_time": "16:30",
      "duration_minutes": 30,
      "available": true
    },
    {
      "date": "2026-06-22",
      "time": "16:30",
      "end_time": "17:00",
      "duration_minutes": 30,
      "available": true
    }
  ]
}
```

---

## 16. Summary

| Aspect                             | Decision                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Model**                          | `Appointment` with `doctor_id`, patient info, `contact_method`, date, time, status, notes                              |
| **`appointment.duration_minutes`** | **REMOVED** — derived from `DoctorAvailability.duration_minutes` (single source of truth)                              |
| **`Doctor.consultation_duration`** | **DEPRECATED** — not used by slot generation. Slot duration comes from `DoctorAvailability.duration_minutes` only.     |
| **`contact_method`**               | **ADDED** — lightweight enum (PHONE, EMAIL, WHATSAPP, VIBER, ZALO, TELEGRAM). Default: PHONE. No channel-specific IDs. |
| **Statuses**                       | PENDING → CONFIRMED or CANCELLED (terminal)                                                                            |
| **Unique constraint**              | `(doctor_id, appointment_date, appointment_time)` prevents double booking                                              |
| **Slot generation**                | Pure function: availability intervals (`duration_minutes`) - existing bookings                                         |
| **Duration resolution**            | `DoctorAvailability.duration_minutes` only — no fallback chain                                                         |
| **Auth model**                     | Public: GET slots, POST appointments. Authenticated: manage own appointments                                           |
| **Touching allowed**               | Yes (09:00-09:30 and 09:30-10:00 can coexist)                                                                          |
| **Past dates/times**               | Rejected at creation                                                                                                   |
| **Availability changes**           | Do not affect existing appointments (snapshot model)                                                                   |
| **Cascade delete**                 | Deleting a doctor cascades to appointments (intentional)                                                               |
| **Messaging future-proofing**      | `contact_method` enum + existing `patient_phone`/`patient_email` cover all planned channels without table redesign     |
