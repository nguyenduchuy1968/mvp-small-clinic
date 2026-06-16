# Sprint 4 — Architecture Review: DoctorAvailability Long-Term Design

> **Status:** Architecture Review (No Implementation)
> **Goal:** Evaluate the current `DoctorAvailability` design against real-world SaaS clinic requirements and decide whether to keep or redesign.
> **Reviewer:** Roo (Architect)
> **Date:** 2026-06-16

---

## Table of Contents

1. [Current Design Summary](#1-current-design-summary)
2. [Operational Workflow Analysis](#2-operational-workflow-analysis)
3. [Scalability Analysis](#3-scalability-analysis)
4. [Future Features Compatibility](#4-future-features-compatibility)
5. [Long-Term Cost Analysis](#5-long-term-cost-analysis)
6. [Recommendation](#6-recommendation)
7. [Appendix: Migration Path (If Redesign Is Chosen)](#7-appendix-migration-path-if-redesign-is-chosen)

---

## 1. Current Design Summary

### 1.1 Database Model

The current [`DoctorAvailability`](backend/app/models.py:174) model stores one row per weekday per interval:

```python
class DoctorAvailability(DoctorAvailabilityBase, table=True):
    __tablename__ = "doctor_availability"
    id: uuid.UUID          # PK
    doctor_id: uuid.UUID   # FK → doctor.id
    weekday: Weekday       # Enum: monday..sunday
    start_time: str        # HH:MM
    end_time: str          # HH:MM
    duration_minutes: int  # Slot length (default 30)
    is_active: bool        # Soft delete / toggle
    created_at: datetime
    updated_at: datetime
```

### 1.2 Example: Standard Work Week

For a doctor working Mon-Fri 08:00-17:00 with 30-min slots:

| doctor_id | weekday   | start_time | end_time | duration_minutes | is_active |
| --------- | --------- | ---------- | -------- | ---------------- | --------- |
| UUID-1    | monday    | 08:00      | 17:00    | 30               | true      |
| UUID-1    | tuesday   | 08:00      | 17:00    | 30               | true      |
| UUID-1    | wednesday | 08:00      | 17:00    | 30               | true      |
| UUID-1    | thursday  | 08:00      | 17:00    | 30               | true      |
| UUID-1    | friday    | 08:00      | 17:00    | 30               | true      |

**5 rows for one doctor with one schedule.**

### 1.3 Slot Generator Dependency

The [`generate_available_slots()`](backend/app/slot_generator.py:57) function queries by `doctor_id + weekday`:

```python
statement = select(DoctorAvailability).where(
    DoctorAvailability.doctor_id == doctor_id,
    DoctorAvailability.weekday == weekday,
    DoctorAvailability.is_active == True,
)
```

This is the **only consumer** of the weekday-based query pattern.

---

## 2. Operational Workflow Analysis

### 2.1 Current Approach: Per-Weekday Rows

**How it works today:**

- Admin creates 5 separate POST requests (or one bulk creation via API)
- Each row is an independent record with its own `id`, `created_at`, `updated_at`
- To change a doctor's hours, admin must update up to 5 rows individually
- To deactivate a doctor, admin must toggle `is_active` on each row (or delete them)

**Real-world friction:**

- Clinic managers think in terms of "Dr. Smith works Mon-Fri 8-5" — not "Dr. Smith has a Monday record, a Tuesday record..."
- A schedule change (e.g., "starting next month, Dr. Smith works 9-6") requires 5 PATCH requests
- There is no concept of "this schedule is valid from date X to date Y" — all rows are always active
- No way to express "Dr. Smith works Mon-Wed 8-5 and Thu-Fri 9-6" as a single logical schedule

### 2.2 Alternative: Recurring Schedule Template

**How it would work:**

- One `DoctorSchedule` record per logical schedule
- Contains a list of active weekdays + time range + duration
- Optional date range for validity (effective_from, effective_until)

```python
class DoctorSchedule(Base):
    doctor_id: uuid.UUID
    start_time: str          # HH:MM
    end_time: str            # HH:MM
    duration_minutes: int    # Slot length
    active_days: list[str]   # ["monday", "tuesday", ...]
    effective_from: date     # When this schedule starts
    effective_until: date | None  # Optional end date
    is_active: bool
```

**Example: Standard Work Week (1 row instead of 5):**

| doctor_id | start_time | end_time | duration | active_days         | effective_from | is_active |
| --------- | ---------- | -------- | -------- | ------------------- | -------------- | --------- |
| UUID-1    | 08:00      | 17:00    | 30       | mon,tue,wed,thu,fri | 2026-01-01     | true      |

**Example: Mixed Schedule (2 rows):**

| doctor_id | start_time | end_time | duration | active_days | effective_from | effective_until | is_active |
| --------- | ---------- | -------- | -------- | ----------- | -------------- | --------------- | --------- |
| UUID-1    | 08:00      | 17:00    | 30       | mon,tue,wed | 2026-01-01     | null            | true      |
| UUID-1    | 09:00      | 18:00    | 30       | thu,fri     | 2026-01-01     | null            | true      |

### 2.3 Workflow Comparison

| Scenario                     | Current (5 rows)    | Template (1-2 rows)              |
| ---------------------------- | ------------------- | -------------------------------- |
| Create standard work week    | 5 API calls         | 1 API call                       |
| Change hours (all days)      | 5 PATCH calls       | 1 PATCH call                     |
| Change hours (specific days) | 1-2 PATCH calls     | Edit active_days list            |
| Deactivate doctor            | 5 PATCH calls       | 1 PATCH call                     |
| Temporary schedule change    | Not supported       | Add new schedule with date range |
| View doctor's schedule       | 5 rows to interpret | 1-2 rows, clear intent           |
| Bulk import (100 doctors)    | 500 rows            | 100-200 rows                     |

**Verdict:** The template approach is **significantly more realistic** for clinic operations. The current approach creates unnecessary administrative overhead for the most common use case (a doctor with a single recurring weekly schedule).

---

## 3. Scalability Analysis

### 3.1 Database Size

| Metric                           | Current Design    | Template Design  |
| -------------------------------- | ----------------- | ---------------- |
| Rows per doctor (standard week)  | 5                 | 1                |
| Rows per doctor (split schedule) | 5-10              | 2-4              |
| 10 doctors (standard)            | 50 rows           | 10 rows          |
| 100 doctors (standard)           | 500 rows          | 100 rows         |
| 1000 doctors (standard)          | 5,000 rows        | 1,000 rows       |
| 1000 doctors (mixed schedules)   | 5,000-10,000 rows | 1,000-4,000 rows |

**Analysis:** At 1000 doctors, the current design produces 5,000+ rows. This is **not a performance concern** for PostgreSQL — 5,000 rows is trivial. The `doctor_id + weekday` index makes queries efficient regardless.

**However**, the row count is not the issue. The issue is **data integrity and maintenance complexity**.

### 3.2 Maintenance Effort

| Task                                                    | Current                                                                                        | Template                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Update all doctors' hours (e.g., shift from 8-5 to 9-6) | `UPDATE doctor_availability SET ... WHERE doctor_id IN (...)` — must update 5x rows per doctor | `UPDATE doctor_schedule SET ... WHERE doctor_id IN (...)` — 1x row per doctor |
| Verify schedule consistency                             | Must check all 5 rows have same start/end/duration                                             | Single row is inherently consistent                                           |
| Detect conflicting schedules                            | Overlap detection across 5 rows per weekday                                                    | Overlap detection across active_days lists                                    |
| Audit trail                                             | 5x created_at/updated_at timestamps                                                            | 1x created_at/updated_at                                                      |

### 3.3 API Complexity

| Aspect          | Current                                          | Template                                                             |
| --------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| Create endpoint | POST /doctors/{id}/availability (single weekday) | POST /doctors/{id}/schedules (bulk weekdays)                         |
| Update endpoint | PATCH /availability/{id} (single row)            | PATCH /schedules/{id} (entire schedule)                              |
| List endpoint   | GET /doctors/{id}/availability (returns 5 rows)  | GET /doctors/{id}/schedules (returns 1-2 rows)                       |
| Slot generation | Query by weekday → iterate rows                  | Query by date → find matching schedule → check active_days → iterate |

**Analysis:** The current API is actually **simpler per-operation** because it operates on individual rows. The template API would need slightly more complex validation (e.g., "no overlapping active_days across schedules"). However, the template API has **fewer total operations** for common workflows.

### 3.4 Frontend Complexity

| Aspect          | Current                                    | Template                                       |
| --------------- | ------------------------------------------ | ---------------------------------------------- |
| Schedule form   | 5 weekday toggles + time inputs (repeated) | Day selector (checkboxes) + time inputs (once) |
| Display         | 5 rows in a table                          | 1-2 rows in a table                            |
| Editing         | Inline edit per row                        | Edit entire schedule at once                   |
| User experience | Tedious for standard weeks                 | Natural for clinic staff                       |

**Verdict:** The template design is **better at scale** for maintenance and frontend UX, though the database impact is negligible either way. The API complexity is comparable.

---

## 4. Future Features Compatibility

### 4.1 Feature Compatibility Matrix

| Future Feature                                                                      | Current Design                                                            | Template Design                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Multiple shifts** (e.g., morning + afternoon)                                     | ✅ Supported — create 2 rows per weekday                                  | ✅ Supported — create 2 schedules with different times                               |
| **Lunch breaks** (e.g., 12:00-13:00 off)                                            | ✅ Supported — create 2 rows per weekday (e.g., 08:00-12:00, 13:00-17:00) | ✅ Supported — create 2 schedules with different times                               |
| **Vacations** (e.g., Dr. Smith off Jul 1-15)                                        | ❌ Not supported — no date range concept                                  | ✅ Supported — `effective_from`/`effective_until` on schedule, or override mechanism |
| **Holidays** (e.g., clinic closed Dec 25)                                           | ❌ Not supported — no date-specific overrides                             | ✅ Supported — date-specific exception list or override schedule                     |
| **Temporary schedule changes** (e.g., Dr. Smith works 10-14 this Thursday)          | ❌ Not supported — would require modifying the weekday row and reverting  | ✅ Supported — add temporary schedule with date range, or override for specific date |
| **Special working days** (e.g., Saturday clinic)                                    | ✅ Supported — create Saturday row                                        | ✅ Supported — add Saturday to active_days or create separate schedule               |
| **Recurring weekly schedules**                                                      | ✅ Supported (current design)                                             | ✅ Supported (native design)                                                         |
| **Date-range-based scheduling** (e.g., summer hours Jul-Aug)                        | ❌ Not supported                                                          | ✅ Supported — `effective_from`/`effective_until`                                    |
| **Schedule templates** (e.g., "Standard Week" template applied to multiple doctors) | ❌ Not supported — must create 5 rows per doctor                          | ✅ Supported — template defines active_days + times, applied to many doctors         |

### 4.2 Critical Gap: Date-Range Awareness

The **most significant limitation** of the current design is the **absence of date-range awareness**.

Currently, `DoctorAvailability` has no concept of "this schedule applies from date X to date Y." Every row is always active (or inactive). This means:

- **Vacations cannot be modeled.** To give Dr. Smith a vacation, you would need to delete or deactivate all 5 weekday rows, then remember to restore them. This is fragile and error-prone.
- **Temporary schedule changes cannot be modeled.** If Dr. Smith works 10-14 instead of 8-5 on a specific Thursday, you would need to modify the Thursday row, then remember to change it back.
- **Holiday closures cannot be modeled.** There is no mechanism to say "the clinic is closed on Dec 25" without modifying every doctor's availability.

### 4.3 Impact on Existing Components

**Slot Generator** ([`slot_generator.py`](backend/app/slot_generator.py:57)):

- Current: Queries by `doctor_id + weekday`
- With template: Would query by `doctor_id` and filter by `target_date` falling within `effective_from`/`effective_until`, then check `active_days` contains the weekday
- **Impact:** Moderate change to the query logic, but the slot generation algorithm (interval → slots) remains identical

**Appointment CRUD** ([`crud.py`](backend/app/crud.py:547)):

- Current: `_validate_availability_window()` queries by `doctor_id + weekday`
- With template: Would need updated query logic
- **Impact:** Moderate — the validation logic changes, but the validation rules (time within interval, slot alignment) remain identical

**Booking Engine** (Appointment API):

- No direct dependency on the availability model structure
- **Impact:** None — the API layer delegates to CRUD and Slot Generator

---

## 5. Long-Term Cost Analysis

### 5.1 If Current Architecture Is Kept

**Limitations that will appear over time:**

1. **No vacation management** — The system cannot express "Dr. Smith is on vacation." Workaround: deactivate all rows, then reactivate. This is fragile and loses the vacation history.

2. **No holiday calendar** — The system cannot express "clinic closed on Dec 25." Workaround: manually deactivate all doctors' availability for that day. This does not scale.

3. **No schedule history** — When a doctor changes their schedule, the old schedule is overwritten. There is no audit trail of "Dr. Smith worked Mon-Fri 8-5 from Jan 2026 to Jun 2026."

4. **No schedule templates** — Onboarding a new doctor requires creating 5 rows manually. There is no "apply standard template" workflow.

5. **Frontend complexity** — The UI must display 5+ rows for a simple schedule, making the interface cluttered for the most common case.

**Required migrations later:**

| Migration                                               | Complexity | Risk                                                   |
| ------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| Add `effective_from`/`effective_until` to existing rows | Low        | Low — nullable columns, backward compatible            |
| Add date-specific override table                        | Medium     | Medium — new table, new query logic                    |
| Consolidate 5 rows into 1 schedule                      | High       | High — data migration, API breaking changes            |
| Add holiday/vacation module                             | High       | High — new feature, integration with existing schedule |

**Estimated total refactoring cost if deferred:** 3-5 sprint cycles (depending on scope)

### 5.2 If Redesigned Now

**Components affected:**

| Component                                                                             | Change Required                                                         | Effort |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| [`models.py`](backend/app/models.py:149)                                              | Add `DoctorSchedule` model (new), deprecate `DoctorAvailability`        | Medium |
| [`crud.py`](backend/app/crud.py:171)                                                  | Add schedule CRUD, update `_validate_availability_window()`             | Medium |
| [`slot_generator.py`](backend/app/slot_generator.py:57)                               | Update query logic to use schedules                                     | Small  |
| [`availability.py`](backend/app/api/routes/availability.py)                           | Add schedule endpoints, keep old endpoints for backward compat          | Medium |
| [`test_doctor_availability.py`](backend/tests/crud/test_doctor_availability.py)       | Add schedule tests, update existing tests                               | Medium |
| [`test_slot_generator.py`](backend/tests/crud/test_slot_generator.py)                 | Update tests to use schedules                                           | Small  |
| [`test_appointment_validation.py`](backend/tests/crud/test_appointment_validation.py) | Update validation tests                                                 | Small  |
| [`test_appointments.py`](backend/tests/api/routes/test_appointments.py)               | Update API tests                                                        | Small  |
| Migration script                                                                      | Create `doctor_schedule` table, migrate data from `doctor_availability` | Medium |

**Estimated effort if done now:** 1-2 sprint cycles

**Key advantage of doing it now:** Sprint 4 is still in progress. The Appointment API was just completed. The Slot Generator and CRUD validation are fresh. There are no production users yet. The cost of change is at its lowest.

### 5.3 Cost Comparison

| Factor                           | Keep Current                 | Redesign Now                        |
| -------------------------------- | ---------------------------- | ----------------------------------- |
| Immediate effort                 | 0                            | 1-2 sprints                         |
| Future migration effort          | 3-5 sprints                  | 0                                   |
| Risk of breaking production      | Low (no changes)             | Low (no production users)           |
| Technical debt accumulation      | High (compounds over time)   | None                                |
| Feature velocity (next 6 months) | Slowing (workarounds needed) | Fast (foundation supports features) |

---

## 6. Recommendation

### Option A: KEEP CURRENT ARCHITECTURE

**Reason to choose this:**

- The current design works correctly for the MVP scope
- No production users yet — the immediate priority is shipping the MVP
- The limitations (vacations, holidays, date ranges) are not MVP requirements
- Refactoring now delays the frontend and other Sprint 4 deliverables

### Option B: REDESIGN NOW

**Reason to choose this:**

- The current design has fundamental limitations (no date-range awareness) that will block future features
- The cost of change is lowest right now (no production data, fresh codebase)
- The template approach reduces row count by 5x and simplifies the frontend
- The redesign is moderate in scope (1-2 sprints) and affects well-understood components

### Final Recommendation: **Option A — KEEP CURRENT ARCHITECTURE (with a caveat)**

**Reasoning:**

The current `DoctorAvailability` design is **adequate for the MVP** and the immediate Sprint 4 deliverables (Appointment Booking, Slot Generator, API). The limitations identified are real but are **not MVP-blocking**:

1. **Vacations** — Not an MVP feature. The MVP does not need vacation management.
2. **Holidays** — Not an MVP feature. The MVP does not need a holiday calendar.
3. **Schedule history** — Not an MVP feature. The MVP does not need audit trails for schedule changes.
4. **Schedule templates** — Nice-to-have, but the current API supports bulk creation if needed.

**However**, I strongly recommend a **lightweight, non-breaking enhancement** rather than a full redesign:

### Recommended Action: Add `effective_from` and `effective_until` to `DoctorAvailability`

This single change addresses the most critical gap (date-range awareness) with minimal effort:

```python
class DoctorAvailability(DoctorAvailabilityBase, table=True):
    # ... existing fields ...
    effective_from: date | None = Field(default=None)   # When this schedule starts
    effective_until: date | None = Field(default=None)  # When this schedule ends (null = indefinite)
```

**Impact:**

- **Slot Generator** ([`slot_generator.py`](backend/app/slot_generator.py:94)): Add one filter condition — `AND (effective_from IS NULL OR effective_from <= target_date) AND (effective_until IS NULL OR effective_until >= target_date)`
- **CRUD validation** ([`crud.py`](backend/app/crud.py:547)): Same filter addition
- **Existing data**: All existing rows have `effective_from=NULL, effective_until=NULL` — meaning "always active," which is backward compatible
- **API**: No breaking changes. The existing endpoints continue to work. New query parameters can be added later.

**This is NOT a full redesign.** It is a single nullable column pair that unlocks date-range-aware scheduling without changing the fundamental architecture. It costs **~1 day** to implement and is fully backward compatible.

### Future Redesign Path

If the product grows and the per-weekday-row model becomes a genuine bottleneck, the full template redesign can be done as a dedicated Sprint 5 or Sprint 6 feature. At that point:

1. Add `DoctorSchedule` table with `active_days` (PostgreSQL array or JSON)
2. Create a migration that consolidates existing `DoctorAvailability` rows into schedules
3. Keep `DoctorAvailability` as a legacy view or deprecate it
4. Update Slot Generator and CRUD to query both tables (with a feature flag)

This approach avoids blocking the MVP while keeping the door open for a proper scheduling system later.

---

## 7. Appendix: Migration Path (If Redesign Is Chosen Later)

### Phase 1: Add Date-Range Columns (Sprint 4 — 1 day)

```sql
ALTER TABLE doctor_availability
ADD COLUMN effective_from date,
ADD COLUMN effective_until date;
```

Update Slot Generator and CRUD to filter by date range.

### Phase 2: Add Schedule Table (Sprint 5 — 2-3 days)

```python
class DoctorSchedule(SQLModel, table=True):
    __tablename__ = "doctor_schedule"
    id: uuid.UUID
    doctor_id: uuid.UUID (FK)
    start_time: str
    end_time: str
    duration_minutes: int
    active_days: list[str]  # PostgreSQL ARRAY or JSON
    effective_from: date
    effective_until: date | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### Phase 3: Dual-Write + Migration (Sprint 5 — 2-3 days)

- Write to both `doctor_availability` and `doctor_schedule` during transition
- Migration script: consolidate 5 rows → 1 schedule
- Feature flag to switch Slot Generator between old and new query

### Phase 4: Deprecate Old Table (Sprint 6 — 1 day)

- Remove `doctor_availability` references
- Drop old table (after verification period)
- Update all tests

**Total future effort:** ~1 sprint (if done as a focused task)

---

## Summary

| Question                      | Answer                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Is the current design broken? | No. It works correctly for the MVP.                                                                             |
| Will it cause problems later? | Yes — lack of date-range awareness will block vacations, holidays, and temporary schedule changes.              |
| Should we redesign now?       | **No.** The MVP should ship.                                                                                    |
| What should we do now?        | Add `effective_from`/`effective_until` columns (~1 day) to enable date-range awareness without a full redesign. |
| When should we redesign?      | Sprint 5 or Sprint 6, when vacation/holiday features are planned.                                               |
