# Sprint 6.7 Phase 1 — Approach Comparison: `blocked_dates` vs `DoctorTimeOff`

## Context

The project specification in [`docs/03_DATABASE.md`](../docs/03_DATABASE.md:104) already defines a `blocked_dates` table:

```
blocked_dates
  id
  doctor_id
  blocked_date    ← single date only
  reason
```

My initial proposal used a `DoctorTimeOff` model with `start_date` + `end_date` (date range). This document compares both approaches and recommends the simplest path.

---

## 1. Approach A: `blocked_dates` (as specified in project docs)

### Model

```python
class BlockedDate(SQLModel, table=True):
    __tablename__ = "blocked_dates"
    id: uuid.UUID
    doctor_id: uuid.UUID  # FK → doctor.id
    blocked_date: date    # single date
    reason: str | None
```

### How it works

- Each row blocks exactly **one date**
- To block a range (e.g., Aug 1–10), insert **10 rows**
- To block a single day (e.g., Aug 1), insert **1 row**

### Slot generator check

```python
# Check if target_date is blocked
statement = select(BlockedDate).where(
    BlockedDate.doctor_id == doctor_id,
    BlockedDate.blocked_date == target_date,  # exact match
)
```

### Pros

- **Simplest possible model** — one date field, no range logic
- **Matches the project spec exactly** — no deviation from documented design
- **Easy to understand** — one row = one blocked day
- **Trivial to query** — exact date match, no `<=` / `>=` comparisons
- **Easy to delete a single day** — just delete that one row

### Cons

- **Range blocking requires N rows** — blocking 2 weeks of vacation = 14 INSERTs
- **No atomic range operation** — if the UI shows a date range picker, the backend must loop and insert N rows in a transaction
- **Harder to edit a range** — to change Aug 1–10 to Aug 1–15, you must delete old rows and insert new ones
- **No single "entity" for a vacation period** — you can't say "delete my summer vacation" as one operation; you delete 14 individual rows
- **List view is noisy** — a 2-week vacation shows as 14 rows in the table instead of 1

---

## 2. Approach B: `DoctorTimeOff` (date range model)

### Model

```python
class DoctorTimeOff(SQLModel, table=True):
    __tablename__ = "doctor_time_off"
    id: uuid.UUID
    doctor_id: uuid.UUID  # FK → doctor.id
    start_date: date      # range start
    end_date: date        # range end (inclusive)
    reason: str | None
```

### How it works

- Each row represents a **time-off period** (single day or multi-day)
- To block a range (e.g., Aug 1–10), insert **1 row** with `start_date=2026-08-01`, `end_date=2026-08-10`
- To block a single day (e.g., Aug 1), insert **1 row** with `start_date=2026-08-01`, `end_date=2026-08-01`

### Slot generator check

```python
# Check if target_date falls within any time-off range
statement = select(DoctorTimeOff).where(
    DoctorTimeOff.doctor_id == doctor_id,
    DoctorTimeOff.start_date <= target_date,
    DoctorTimeOff.end_date >= target_date,
)
```

### Pros

- **1 row = 1 time-off period** — whether it's 1 day or 30 days
- **Atomic range operations** — create, edit, delete a vacation as a single operation
- **Clean list view** — each vacation shows as one row
- **Natural for date range picker UI** — the frontend date range picker maps directly to `start_date` / `end_date`
- **Easier to edit** — change `end_date` from Aug 10 to Aug 15 with one PATCH

### Cons

- **Slightly more complex query** — uses `<=` / `>=` range comparison instead of exact match
- **Requires validation** — must ensure `start_date <= end_date`
- **Deviates from project spec** — the spec says `blocked_date` (singular), not `start_date` / `end_date`

---

## 3. Head-to-Head Comparison

| Criteria                            | `blocked_dates`             | `DoctorTimeOff`            | Winner                     |
| ----------------------------------- | --------------------------- | -------------------------- | -------------------------- |
| **Model complexity**                | 1 date field                | 2 date fields              | `blocked_dates`            |
| **Query complexity**                | Exact match (`=`)           | Range match (`<=` / `>=`)  | `blocked_dates`            |
| **Single-day block**                | 1 row                       | 1 row                      | Tie                        |
| **Multi-day block (e.g., 10 days)** | 10 rows                     | 1 row                      | `DoctorTimeOff`            |
| **Edit range (extend vacation)**    | Delete + re-insert N rows   | Single PATCH on `end_date` | `DoctorTimeOff`            |
| **Delete entire vacation**          | Delete N rows               | Delete 1 row               | `DoctorTimeOff`            |
| **List view clarity**               | 14 rows for 2-week vacation | 1 row for 2-week vacation  | `DoctorTimeOff`            |
| **Matches project spec**            | ✅ Yes                      | ❌ No                      | `blocked_dates`            |
| **Frontend date range picker**      | Must loop + insert N rows   | Direct 1:1 mapping         | `DoctorTimeOff`            |
| **Validation required**             | None (single date)          | `start_date <= end_date`   | `blocked_dates`            |
| **Total implementation effort**     | ~15 files                   | ~15 files                  | Tie (same number of files) |

---

## 4. Recommendation

### For a 1–2 doctor clinic MVP: Use `blocked_dates` (as specified)

**Reasoning:**

1. **Matches the project spec** — the `blocked_dates` table is already documented in [`docs/03_DATABASE.md`](../docs/03_DATABASE.md:104). Implementing what's specified reduces confusion and keeps the codebase aligned with the design docs.

2. **Sufficient for MVP scale** — a 1–2 doctor clinic will have at most a handful of blocked dates at any time. Even a 2-week vacation is only 14 rows. The database can handle this trivially.

3. **Simplest possible implementation** — the slot generator check is a single exact-match query. No range validation needed. No edge cases with overlapping ranges.

4. **The "N rows" problem is not a real problem at this scale** — 14 INSERTs in a transaction is instantaneous. The UI can show a date range picker and the backend loops to create individual rows. This is a common pattern (e.g., calendar apps store individual event instances).

5. **Easier to delete a single day** — if a doctor wants to unblock just one day in the middle of a vacation, they delete one row. With `DoctorTimeOff`, they'd need to split one range into two ranges.

### When to upgrade to `DoctorTimeOff`

If the clinic grows to 5+ doctors or if doctors frequently block large ranges (months at a time), the N-rows-per-range approach becomes unwieldy. At that point, migrate to a `DoctorTimeOff` model with `start_date` / `end_date`. This is a straightforward migration:

```sql
-- Convert blocked_dates rows to DoctorTimeOff ranges
-- (Group by doctor_id + reason + contiguous date blocks)
INSERT INTO doctor_time_off (doctor_id, start_date, end_date, reason)
SELECT doctor_id, MIN(blocked_date), MAX(blocked_date), reason
FROM blocked_dates
GROUP BY doctor_id, reason, date_block_group;
```

But for MVP, this complexity is unnecessary.

---

## 5. Final Architecture Decision

### Model: `BlockedDate` (as specified)

```python
class BlockedDate(SQLModel, table=True):
    __tablename__ = "blocked_dates"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doctor_id: uuid.UUID = Field(
        foreign_key="doctor.id", nullable=False, ondelete="CASCADE",
        index=True,
    )
    blocked_date: date
    reason: str | None = Field(default=None, max_length=500)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )

    doctor: Optional["Doctor"] = Relationship(back_populates="blocked_dates")
```

### Doctor model update

```python
class Doctor(DoctorBase, table=True):
    # ... existing fields ...
    blocked_dates: list["BlockedDate"] = Relationship(
        back_populates="doctor",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
```

### Unique constraint

```python
__table_args__ = (
    sa.UniqueConstraint(
        "doctor_id", "blocked_date",
        name="uq_blocked_date_per_doctor",
    ),
)
```

This prevents accidentally blocking the same date twice.

### API endpoints

| Method   | Path                                 | Purpose                                               |
| -------- | ------------------------------------ | ----------------------------------------------------- |
| `GET`    | `/doctors/{doctor_id}/blocked-dates` | List blocked dates                                    |
| `POST`   | `/doctors/{doctor_id}/blocked-dates` | Block one or more dates (accept single date or array) |
| `DELETE` | `/blocked-dates/{blocked_date_id}`   | Unblock a single date                                 |

**POST body for range blocking:**

```json
{
  "dates": ["2026-08-01", "2026-08-02", ..., "2026-08-10"],
  "reason": "Vacation"
}
```

The backend loops and inserts each date in a transaction. If any date is already blocked (unique constraint violation), the entire transaction rolls back and returns 409 Conflict.

### Slot generator check

```python
# Check if target_date is blocked
statement = select(BlockedDate).where(
    BlockedDate.doctor_id == doctor_id,
    BlockedDate.blocked_date == target_date,
)
if session.exec(statement).first() is not None:
    return AvailableSlotsResponse(
        doctor_id=doctor_id,
        date=target_date,
        slots=[],
        count=0,
        reason="doctor_unavailable",
    )
```

### Validation rules

| Rule                                            | Enforcement                         |
| ----------------------------------------------- | ----------------------------------- |
| `blocked_date` must not be in the past          | CRUD layer — 400 Bad Request        |
| `blocked_date` must not be > 365 days in future | CRUD layer — 400 Bad Request        |
| Duplicate `doctor_id` + `blocked_date`          | DB unique constraint — 409 Conflict |

### Frontend

Same structure as previously proposed, but:

- Table column is `blocked_date` (single date) instead of `start_date` / `end_date`
- Create form uses a date range picker on the frontend, but the backend receives individual dates
- List shows one row per blocked date, sorted by date
- For a vacation, the list shows N rows — acceptable for MVP scale

---

## 6. Summary

| Aspect                | `blocked_dates` (chosen) | `DoctorTimeOff` (alternative) |
| --------------------- | ------------------------ | ----------------------------- |
| Rows for 1-day block  | 1                        | 1                             |
| Rows for 10-day block | 10                       | 1                             |
| Query                 | `=` exact match          | `<=` / `>=` range             |
| Matches project spec  | ✅ Yes                   | ❌ No                         |
| Validation            | Minimal                  | `start <= end`                |
| Edit vacation         | Delete + re-insert       | Single PATCH                  |
| MVP suitability       | ✅ Best for 1–2 doctors  | Over-engineered for MVP       |
| Migration path        | N/A                      | Can migrate later if needed   |

**Decision: Use `blocked_dates` as specified in [`docs/03_DATABASE.md`](../docs/03_DATABASE.md:104).** It is the simplest implementation that satisfies the requirements for a 1–2 doctor clinic MVP.
