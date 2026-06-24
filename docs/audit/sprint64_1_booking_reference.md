# Sprint 6.4.1 — Booking Reference Number

**Format:** `BK-0001`, `BK-0002`, `BK-0003` ... (sequential, no date)

---

## Architecture Validation: PostgreSQL Sequence

**Question:** Can a PostgreSQL sequence generate `BK-0001`, `BK-0002`, ... without race conditions?

**Answer: Yes — this is the recommended approach.**

### How PostgreSQL Sequences Work

A `SEQUENCE` in PostgreSQL is a **database object** that generates a gapless (or nearly gapless) series of unique integers. Key properties:

1. **Atomic increment** — `nextval()` is atomic and transaction-safe. Two concurrent transactions calling `nextval()` will always get different values, even if one rolls back.
2. **No race conditions** — The sequence counter is managed outside of transaction isolation. `nextval()` never blocks and never returns the same value twice.
3. **Performance** — Sequences are designed for high-concurrency OLTP workloads. No locking overhead.

### Sequence Behavior

| Scenario                    | Value Returned | Notes                                          |
| --------------------------- | -------------- | ---------------------------------------------- |
| Transaction A calls nextval | 1              | Committed                                      |
| Transaction B calls nextval | 2              | Committed                                      |
| Transaction C calls nextval | 3              | Rolls back                                     |
| Transaction D calls nextval | 4              | 3 is **skipped** (sequence does not roll back) |

**Important:** Sequences are not truly gapless. If a transaction acquires a sequence value but rolls back, that value is lost. This is acceptable for booking reference numbers — gaps are expected and harmless.

### SQL to Create the Sequence

```sql
CREATE SEQUENCE booking_number_seq START 1;
```

### SQL to Generate a Booking Number

```sql
SELECT 'BK-' || LPAD(nextval('booking_number_seq')::text, 4, '0');
```

This produces: `BK-0001`, `BK-0002`, ..., `BK-9999`, `BK-10000`, ...

### Why Not COUNT-Based?

A `COUNT(*)` approach would require:

1. A `SERIALIZABLE` transaction (expensive, blocks concurrent writes)
2. Or a `SELECT ... FOR UPDATE` lock on the table (blocks concurrent inserts)
3. Or a separate counter table with pessimistic locking

All of these are slower and more complex than a sequence. **Use the sequence.**

---

## Implementation Plan

### Phase 1: Database Migration

**File to create:** `backend/app/alembic/versions/XXXX_add_booking_number_to_appointment.py`

**Steps:**

1. Create the sequence:

   ```python
   op.execute("CREATE SEQUENCE booking_number_seq START 1")
   ```

2. Add the column (nullable initially — existing rows don't have one):

   ```python
   op.add_column(
       "appointment",
       sa.Column("booking_number", sa.String(30), nullable=True),
   )
   ```

3. Backfill existing appointments with sequential booking numbers:

   ```python
   conn = op.get_bind()
   result = conn.execute(
       sa.text("SELECT id FROM appointment ORDER BY created_at, id")
   )
   seq = 1
   for row in result:
       bn = f"BK-{seq:04d}"
       conn.execute(
           sa.text("UPDATE appointment SET booking_number = :bn WHERE id = :id"),
           {"bn": bn, "id": row[0]},
       )
       seq += 1
   ```

4. Set NOT NULL after backfill:

   ```python
   op.alter_column("appointment", "booking_number", nullable=False)
   ```

5. Add unique constraint and index:
   ```python
   op.create_unique_constraint(
       "uq_appointment_booking_number", "appointment", ["booking_number"]
   )
   op.create_index(
       "ix_appointment_booking_number", "appointment", ["booking_number"]
   )
   ```

**Rollback:**

```python
def downgrade():
    op.drop_index("ix_appointment_booking_number", table_name="appointment")
    op.drop_constraint("uq_appointment_booking_number", "appointment")
    op.drop_column("appointment", "booking_number")
    op.execute("DROP SEQUENCE IF EXISTS booking_number_seq")
```

---

### Phase 2: Backend Changes

#### 2a. Model — [`backend/app/models.py`](backend/app/models.py)

**Add to `AppointmentBase`** (around line 271, before the closing brace):

```python
booking_number: str | None = Field(
    default=None, max_length=30, nullable=True
)
```

**Why nullable=True on the base model?** Because `AppointmentCreate` doesn't include `booking_number` (it's generated server-side). The ORM `Appointment` model needs it as nullable so SQLAlchemy doesn't require it during insert. After generation, it's set to NOT NULL at the DB level.

**Alternative:** Keep `booking_number` out of `AppointmentBase` entirely and add it only to:

- `Appointment` ORM model (as a standalone field, not inherited)
- `AppointmentPublic` response schema

This is cleaner because `booking_number` is not user-supplied. However, it means `_appointment_to_public()` must explicitly map it.

**Recommendation:** Add to `AppointmentBase` for simplicity — the field is read-only on `AppointmentCreate` (never sent by client) and auto-populated on the response.

#### 2b. CRUD — [`backend/app/crud.py`](backend/app/crud.py)

**Add helper function** (new function, placed before `create_appointment`):

```python
def _generate_booking_number(session: Session) -> str:
    """Generate a unique booking reference number using a DB sequence."""
    result = session.execute(
        text("SELECT 'BK-' || LPAD(nextval('booking_number_seq')::text, 4, '0')")
    )
    return result.scalar()
```

**Modify `create_appointment()`** (around line 848-863):

After `session.commit()` succeeds (line 851), add:

```python
# 8. Generate booking number after successful commit
booking_number = _generate_booking_number(session)
db_obj.booking_number = booking_number
session.add(db_obj)
session.commit()
session.refresh(db_obj)
```

**Important:** The booking number is generated **after** the initial commit to ensure the appointment row exists. A second commit updates just the `booking_number` field.

**Alternative (single commit):** Generate the booking number before the first commit, but this risks sequence value waste on IntegrityError (rollback). The two-commit approach is safer.

#### 2c. `_appointment_to_public()` — [`backend/app/crud.py`](backend/app/crud.py)

**No change needed** if `booking_number` is on `AppointmentBase` — the `AppointmentPublic(...)` constructor already maps all base fields.

If `booking_number` is added only to `Appointment` and `AppointmentPublic` (not `AppointmentBase`), add:

```python
booking_number=appointment.booking_number,
```

#### 2d. API Routes — [`backend/app/api/routes/appointments.py`](backend/app/api/routes/appointments.py)

**No changes needed.** The `POST /appointments` endpoint returns `AppointmentPublic` which will automatically include `booking_number`.

---

### Phase 3: Frontend Changes

#### 3a. Regenerate OpenAPI Client

After backend changes are deployed, regenerate:

```bash
cd frontend
bun run generate-client
```

This updates:

- [`frontend/src/client/types.gen.ts`](frontend/src/client/types.gen.ts) — `AppointmentPublic` gets `booking_number?: string | null`
- [`frontend/src/client/sdk.gen.ts`](frontend/src/client/sdk.gen.ts) — no functional change
- [`frontend/src/client/schemas.gen.ts`](frontend/src/client/schemas.gen.ts) — schema validation updated

#### 3b. BookingConfirmation — [`frontend/src/components/Booking/BookingConfirmation.tsx`](frontend/src/components/Booking/BookingConfirmation.tsx)

**Replace the ID row** (line 42-44):

**Before:**

```tsx
<div className="flex justify-between">
  <dt className="text-muted-foreground">ID</dt>
  <dd className="font-mono font-medium">{appointment.id}</dd>
</div>
```

**After:**

```tsx
<div className="flex justify-between">
  <dt className="text-muted-foreground">
    {t('confirmation.bookingReference')}
  </dt>
  <dd className="font-mono font-medium">
    {appointment.booking_number ?? appointment.id}
  </dd>
</div>
```

**Fallback:** `appointment.booking_number ?? appointment.id` ensures the UI never shows blank if the migration hasn't run yet.

#### 3c. AppointmentDetails — [`frontend/src/components/Appointments/AppointmentDetails.tsx`](frontend/src/components/Appointments/AppointmentDetails.tsx)

**Add booking reference display** in the `AppointmentInfoCard` component (after the status row, around line 47):

```tsx
{
  appointment.booking_number && (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {t('detail.bookingReference')}
      </span>
      <span className="font-mono text-sm font-medium">
        {appointment.booking_number}
      </span>
    </div>
  );
}
```

**Note:** No fallback needed here — if `booking_number` is null, the row simply doesn't render.

#### 3d. i18n — [`frontend/src/i18n/locales/en/appointments.json`](frontend/src/i18n/locales/en/appointments.json)

Add to `detail` section:

```json
"bookingReference": "Booking Ref"
```

Add to `confirmation` section in [`frontend/src/i18n/locales/en/booking.json`](frontend/src/i18n/locales/en/booking.json):

```json
"bookingReference": "Booking Reference"
```

Repeat for `vi/appointments.json`, `vi/booking.json`, `uk/appointments.json`, `uk/booking.json`.

---

## Files Changed Summary

| #   | File                                                                                                                         | Change Type                                                      | Risk                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| 1   | `backend/app/alembic/versions/XXXX_add_booking_number.py`                                                                    | **New file**                                                     | Medium — migration must handle existing data |
| 2   | [`backend/app/models.py`](backend/app/models.py)                                                                             | Add `booking_number` field to `AppointmentBase`                  | Low                                          |
| 3   | [`backend/app/crud.py`](backend/app/crud.py)                                                                                 | Add `_generate_booking_number()` + update `create_appointment()` | Low                                          |
| 4   | [`frontend/src/client/types.gen.ts`](frontend/src/client/types.gen.ts)                                                       | Re-generate                                                      | Low                                          |
| 5   | [`frontend/src/client/sdk.gen.ts`](frontend/src/client/sdk.gen.ts)                                                           | Re-generate                                                      | Low                                          |
| 6   | [`frontend/src/client/schemas.gen.ts`](frontend/src/client/schemas.gen.ts)                                                   | Re-generate                                                      | Low                                          |
| 7   | [`frontend/src/components/Booking/BookingConfirmation.tsx`](frontend/src/components/Booking/BookingConfirmation.tsx)         | Replace UUID with `booking_number`                               | Low                                          |
| 8   | [`frontend/src/components/Appointments/AppointmentDetails.tsx`](frontend/src/components/Appointments/AppointmentDetails.tsx) | Add booking reference display                                    | Low                                          |
| 9   | [`frontend/src/i18n/locales/en/booking.json`](frontend/src/i18n/locales/en/booking.json)                                     | Add `bookingReference` key                                       | Low                                          |
| 10  | [`frontend/src/i18n/locales/vi/booking.json`](frontend/src/i18n/locales/vi/booking.json)                                     | Add `bookingReference` key                                       | Low                                          |
| 11  | [`frontend/src/i18n/locales/uk/booking.json`](frontend/src/i18n/locales/uk/booking.json)                                     | Add `bookingReference` key                                       | Low                                          |
| 12  | [`frontend/src/i18n/locales/en/appointments.json`](frontend/src/i18n/locales/en/appointments.json)                           | Add `detail.bookingReference` key                                | Low                                          |
| 13  | [`frontend/src/i18n/locales/vi/appointments.json`](frontend/src/i18n/locales/vi/appointments.json)                           | Add `detail.bookingReference` key                                | Low                                          |
| 14  | [`frontend/src/i18n/locales/uk/appointments.json`](frontend/src/i18n/locales/uk/appointments.json)                           | Add `detail.bookingReference` key                                | Low                                          |

---

## Execution Order

```
Phase 1 (DB Migration)
  └── 1. Create migration script
  └── 2. Run migration: alembic upgrade head

Phase 2 (Backend)
  └── 3. Add booking_number to AppointmentBase in models.py
  └── 4. Add _generate_booking_number() to crud.py
  └── 5. Update create_appointment() in crud.py
  └── 6. Run backend tests

Phase 3 (Frontend)
  └── 7. Regenerate OpenAPI client
  └── 8. Update BookingConfirmation.tsx
  └── 9. Update AppointmentDetails.tsx
  └── 10. Add i18n keys
  └── 11. Run frontend build + tests
```

---

## Edge Cases & Risks

| Edge Case                                  | Handling                                                                   | Risk   |
| ------------------------------------------ | -------------------------------------------------------------------------- | ------ |
| Sequence wraps after 9999                  | Format auto-expands: `BK-10000` (no leading zeros after 9999)              | Low    |
| Transaction rollback wastes sequence value | Gap in numbering — acceptable                                              | Low    |
| Migration fails on large dataset           | Backfill in batches with `LIMIT`/`OFFSET`                                  | Medium |
| Frontend shows null booking_number         | Fallback: `appointment.booking_number ?? appointment.id`                   | Low    |
| Concurrent booking during migration        | Sequence is created before backfill — new bookings get numbers immediately | Low    |
| Booking number exceeds 30 chars            | Format `BK-` + up to 26 digits = max 29 chars — safe                       | Low    |

---

_End of Sprint 6.4.1 Implementation Plan_
