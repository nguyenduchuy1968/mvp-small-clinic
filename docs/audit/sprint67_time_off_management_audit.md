# AUDIT REPORT — Sprint 6.7: Time Off Management

## 1. Executive Summary

This audit evaluates whether the current system supports **Time Off Management** — the ability for doctors to block specific dates or date ranges (single day, multiple days, vacation periods) so that no appointments can be booked during those periods.

**Finding: Time Off Management does NOT exist.** The current architecture only supports recurring weekly schedules via [`DoctorAvailability`](../backend/app/models.py:176). There is no model, no API endpoint, no validation logic, and no UI for blocking specific dates or date ranges.

---

## 2. Current Architecture — What Exists

### 2.1 DoctorAvailability (Recurring Weekly Schedule)

| Field              | Type    | Description                                                    |
| ------------------ | ------- | -------------------------------------------------------------- |
| `weekday`          | Enum    | MONDAY–SUNDAY — which day of the week this interval applies to |
| `start_time`       | `HH:MM` | Interval start (e.g., `09:00`)                                 |
| `end_time`         | `HH:MM` | Interval end, exclusive (e.g., `12:00`)                        |
| `duration_minutes` | int     | Slot duration (e.g., `30` for 30-min slots)                    |
| `is_active`        | bool    | Whether this interval is currently active                      |

**Key characteristic:** This is a **recurring weekday-based** schedule. It cannot express:

- "Doctor is on vacation June 1–15"
- "Doctor is unavailable on March 20 (single day)"
- "Doctor is available only mornings on Wednesdays in July"

### 2.2 Slot Generation Flow

```
DoctorAvailability (weekday pattern)
        │
        ▼
slot_generator.generate_available_slots()
        │
        ├── 1. Lookup weekday → active intervals
        ├── 2. Generate slot times from intervals
        ├── 3. Remove booked slots (PENDING/CONFIRMED)
        ├── 4. Filter past slots (today only)
        └── 5. Return AvailableSlotsResponse
```

Source: [`backend/app/slot_generator.py:63`](../backend/app/slot_generator.py:63)

### 2.3 Appointment Creation Validation Chain

```
create_appointment()
  ├── 1. _validate_doctor_active()       — doctor exists + is_active=True
  ├── 2. _validate_appointment_date()    — not in past
  ├── 3. _validate_availability_window() — matches weekday interval + slot alignment
  ├── 4. _validate_contact_info()        — phone/email format
  ├── 5. _check_double_booking()         — no PENDING/CONFIRMED at same slot
  └── 6. DB commit (IntegrityError catch for race condition)
```

Source: [`backend/app/crud.py:875`](../backend/app/crud.py:875)

**There is NO step that checks for blocked dates, time off, or doctor unavailability overrides.**

### 2.4 Doctor Model — Relevant Fields

| Field       | Type | Description                                   |
| ----------- | ---- | --------------------------------------------- |
| `is_active` | bool | If `False`, the doctor is completely disabled |

The only way to prevent a doctor from receiving bookings is to set `is_active = False`, which blocks ALL dates. There is no granular time-off mechanism.

---

## 3. Answers to the 5 Audit Questions

### Q1: Can a doctor block a single day, multiple days, or a vacation period?

**No.** There is no mechanism to block specific dates or date ranges. The only options are:

| Action                                                     | Effect                                   | Limitation                                                          |
| ---------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Set `is_active = False` on a `DoctorAvailability` interval | Disables that weekday pattern globally   | Affects ALL dates with that weekday — cannot target a specific date |
| Set `is_active = False` on the `Doctor`                    | Disables ALL bookings for the doctor     | Cannot receive ANY bookings, even after the time-off period ends    |
| Delete a `DoctorAvailability` interval                     | Removes that weekday pattern permanently | Destructive — must recreate the interval after time off             |

**None of these workarounds are acceptable for real clinic operations.**

### Q2: Can existing bookings coexist with blocked periods?

**There is no concept of blocked periods, so this question is moot.** However, if a blocked period feature were added, the system would need to decide:

- **Option A:** Blocked periods prevent NEW bookings but EXISTING bookings remain (recommended — a doctor's vacation shouldn't cancel patients who already booked)
- **Option B:** Blocked periods force-cancel existing bookings (dangerous — would require notification workflows)

### Q3: What happens when a doctor becomes unavailable after bookings already exist?

**Currently, nothing.** If a doctor's `is_active` is set to `False` or their availability intervals are deleted after bookings exist:

- Existing appointments remain in the database with their current status (PENDING/CONFIRMED)
- The slot generator will return `reason: "doctor_unavailable"` for future dates
- **No notification is sent** to affected patients
- **No status change** occurs on existing appointments
- The appointments page would still show these appointments, but the doctor is marked inactive

This is a **data integrity gap** — the system allows a doctor to become unavailable while holding active appointments.

### Q4: Is the current functionality sufficient for a real small clinic?

**No.** A real small clinic (1–5 doctors) requires at minimum:

1. **Single-day time off** — "Doctor is unavailable on March 20"
2. **Multi-day / vacation time off** — "Doctor is on vacation June 1–15"
3. **Recurring exception** — "Doctor is unavailable every Wednesday in July"
4. **Existing booking preservation** — Blocked periods should not auto-cancel existing bookings
5. **Admin visibility** — Admin should see when a doctor is on time off

Without these, the clinic cannot:

- Let doctors take vacation days
- Handle sick days
- Block dates for conferences or training
- Manage partial-day unavailability (e.g., "doctor is available only in the morning on this specific date")

### Q5: What UX improvements are needed?

**Backend (API + DB):**

| Feature                         | Priority | Description                                                 |
| ------------------------------- | -------- | ----------------------------------------------------------- |
| `DoctorTimeOff` model           | P0       | New DB model for date-range blocking                        |
| CRUD endpoints for time off     | P0       | Create, read, update, delete time-off periods               |
| Slot generator integration      | P0       | `generate_available_slots()` must exclude blocked dates     |
| Appointment creation validation | P0       | `create_appointment()` must reject blocked dates            |
| Existing booking handling       | P1       | Warn when creating time off that overlaps existing bookings |

**Frontend (UI):**

| Feature                | Priority | Description                                                      |
| ---------------------- | -------- | ---------------------------------------------------------------- |
| Time Off list page     | P0       | View all upcoming/past time-off periods for a doctor             |
| Create Time Off form   | P0       | Date range picker + reason field                                 |
| Calendar view          | P1       | Visual calendar showing blocked dates vs available dates         |
| Booking page indicator | P1       | Show "Doctor is unavailable on this date" in the booking wizard  |
| Conflict warning       | P1       | When creating time off, show count of existing bookings affected |

---

## 4. Recommended Sprint 6.7 Scope

### Phase 1 — Core Data Model & API (Backend)

**4.1.1 New Model: `DoctorTimeOff`**

```python
class DoctorTimeOff(SQLModel, table=True):
    __tablename__ = "doctor_time_off"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id", nullable=False, index=True)
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    doctor: Doctor = Relationship(back_populates="time_off")
```

**4.1.2 Slot Generator Integration**

In [`slot_generator.py:generate_available_slots()`](../backend/app/slot_generator.py:63), add a step between steps 2 and 3:

```python
# 2.5. Check if doctor has time off on target_date
time_off_statement = select(DoctorTimeOff).where(
    DoctorTimeOff.doctor_id == doctor_id,
    DoctorTimeOff.start_date <= target_date,
    DoctorTimeOff.end_date >= target_date,
    DoctorTimeOff.is_active == True,
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

**4.1.3 Appointment Creation Validation**

In [`crud.py:create_appointment()`](../backend/app/crud.py:875), add a new validation step between steps 2 and 3:

```python
# 2.5. Check if doctor has time off on this date
_validate_no_time_off(
    session=session,
    doctor_id=appointment_in.doctor_id,
    appointment_date=appointment_in.appointment_date,
)
```

**4.1.4 CRUD Functions**

| Function                   | Purpose                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `create_doctor_time_off()` | Create a time-off period                                                            |
| `get_doctor_time_off()`    | Get time-off periods for a doctor (with date filtering)                             |
| `update_doctor_time_off()` | Update a time-off period                                                            |
| `delete_doctor_time_off()` | Delete a time-off period                                                            |
| `_validate_no_time_off()`  | Check if a specific date is blocked (used by slot generator + appointment creation) |

**4.1.5 API Endpoints**

| Method   | Path                            | Purpose                            |
| -------- | ------------------------------- | ---------------------------------- |
| `GET`    | `/doctors/{doctor_id}/time-off` | List time-off periods for a doctor |
| `POST`   | `/doctors/{doctor_id}/time-off` | Create a time-off period           |
| `PATCH`  | `/time-off/{time_off_id}`       | Update a time-off period           |
| `DELETE` | `/time-off/{time_off_id}`       | Delete a time-off period           |

### Phase 2 — Frontend (Admin Panel)

**4.2.1 Time Off Management Page**

- New route: `/doctors/{doctor_id}/time-off`
- Table showing all time-off periods (past and future)
- Create button → date range picker modal
- Edit/delete actions per row
- Conflict warning when creating time off that overlaps existing bookings

**4.2.2 Booking Wizard Integration**

- When a date is selected that falls within a time-off period, show a clear message:
  "Doctor [name] is unavailable on [date]. Please select another date."
- The date picker should visually indicate blocked dates (e.g., greyed out, strikethrough)

### Phase 3 — Edge Cases & Data Integrity

**4.3.1 Existing Bookings During Time Off**

When creating a time-off period, the system should:

1. Check if any existing PENDING/CONFIRMED appointments fall within the date range
2. Show a warning with the count of affected appointments
3. Allow creation anyway (the doctor may have approved these before the time off)
4. NOT auto-cancel existing appointments

**4.3.2 Time Off in the Past**

- Creating time off for past dates should be allowed (for record-keeping)
- Past time off should NOT affect slot generation (dates already passed)

**4.3.3 Overlapping Time Off Periods**

- Allow overlapping time-off periods (a doctor might have multiple reasons)
- Slot generator should check all active periods — if ANY match, the date is blocked

**4.3.4 Doctor Deactivation**

- If a doctor is set to `is_active = False`, their time-off records should be preserved
- When reactivated, time-off records should still be valid

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      SLOT GENERATION FLOW                       │
│                                                                 │
│  target_date + doctor_id                                         │
│         │                                                        │
│         ▼                                                        │
│  1. Lookup weekday of target_date                                │
│         │                                                        │
│         ▼                                                        │
│  2. Load active DoctorAvailability intervals for weekday         │
│         │                                                        │
│         ▼                                                        │
│  [NEW] 3. Check DoctorTimeOff for target_date                    │
│         │                                                        │
│         ├── Blocked → return empty with reason="doctor_unavailable"
│         │                                                        │
│         ▼ (not blocked)                                          │
│  4. Generate slot times from intervals                           │
│         │                                                        │
│         ▼                                                        │
│  5. Remove booked slots (PENDING/CONFIRMED)                      │
│         │                                                        │
│         ▼                                                        │
│  6. Filter past slots (today only)                               │
│         │                                                        │
│         ▼                                                        │
│  7. Return AvailableSlotsResponse                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Summary

| Capability                    | Status      | Action Required                        |
| ----------------------------- | ----------- | -------------------------------------- |
| Recurring weekly schedule     | ✅ Complete | None                                   |
| Single-day time off           | ❌ Missing  | New model + API + slot gen integration |
| Multi-day / vacation time off | ❌ Missing  | Same as above (date range)             |
| Recurring exceptions          | ❌ Missing  | Future enhancement                     |
| Existing booking preservation | ❌ Missing  | Conflict warning on creation           |
| Admin visibility of time off  | ❌ Missing  | New frontend page                      |
| Booking wizard awareness      | ❌ Missing  | Date picker + message integration      |

**Verdict:** Time Off Management is **NOT complete**. It requires a new database model, CRUD functions, API endpoints, slot generator integration, appointment creation validation, and frontend UI. This is a **medium-sized feature** that can be delivered in Sprint 6.7.
