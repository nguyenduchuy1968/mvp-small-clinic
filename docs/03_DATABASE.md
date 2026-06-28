# Database Design

## users

Purpose:

System authentication.

Fields:

- id (UUID, PK)
- email (VARCHAR 255, unique, indexed)
- hashed_password (VARCHAR)
- role (ENUM: admin, doctor)
- is_active (BOOLEAN)
- is_superuser (BOOLEAN)
- full_name (VARCHAR 255, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Relationships:

- doctor (1:1, optional) — Doctor profile linked to this user
- patient (1:1, optional) — Patient identity linked to this user

Roles:

- admin
- doctor

---

## patients

Purpose:

Central identity of the booking system. A Patient represents a person who books appointments. A Patient may exist without a User account (guest booking, reception-created). When a patient registers an account, the Patient is linked to a User via `user_id`.

Fields:

- id (UUID, PK)
- user_id (UUID, nullable, FK → users.id, unique, SET NULL on delete)
- full_name (VARCHAR 255, NOT NULL)
- phone (VARCHAR 20, nullable, indexed)
- email (VARCHAR 255, nullable, indexed)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Constraints:

- `uq_patient_phone`: Unique constraint on phone
- `uq_patient_email`: Unique constraint on email

Relationships:

- user (1:1, optional) — The User account linked to this patient
- appointments (1:N) — All appointments belonging to this patient

Duplicate Prevention:

When creating an appointment, the system resolves the Patient using this priority:

1. Phone (exact or normalized match — strips spaces, dashes, dots, parens)
2. Email (exact match)

If a matching patient is found, it is reused. If not found, a new Patient is created. This ensures no duplicate patient records.

---

## doctors

Fields:

- id (UUID, PK)
- user_id (UUID, FK → users.id, unique, CASCADE on delete)
- full_name (VARCHAR 255)
- specialty (VARCHAR 255, nullable)
- experience_years (INT, nullable)
- bio (VARCHAR 2000, nullable)
- photo_url (VARCHAR 500, nullable)
- phone (VARCHAR 50, nullable)
- consultation_duration (INT, nullable, 5-180 min)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Relationships:

- user (1:1) — The User account for this doctor
- availability (1:N) — Weekly availability intervals
- appointments (1:N) — Appointments with this doctor
- blocked_dates (1:N) — Blocked/off dates

---

## appointments

Fields:

- id (UUID, PK)
- doctor_id (UUID, FK → doctors.id, indexed)
- patient_id (UUID, nullable, FK → patients.id, SET NULL on delete, indexed)
- patient_name (VARCHAR 255) — Denormalized snapshot of patient name at booking time
- patient_phone (VARCHAR 20) — Denormalized snapshot of patient phone at booking time
- patient_email (VARCHAR 255, nullable) — Denormalized snapshot of patient email at booking time
- contact_method (ENUM: phone, email, whatsapp, viber, zalo, telegram)
- appointment_date (DATE)
- appointment_time (VARCHAR 5, HH:MM format)
- status (ENUM: pending, confirmed, cancelled)
- notes (VARCHAR 2000, nullable)
- booking_number (VARCHAR 30, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Constraints:

- `uq_appointment_slot_active`: Partial unique index on (doctor_id, appointment_date, appointment_time) WHERE status IN ('pending', 'confirmed') — prevents double-booking of active appointments while allowing cancelled appointments at the same slot.

Relationships:

- doctor (N:1) — The doctor for this appointment
- patient (N:1, optional) — The patient for this appointment

Note: The denormalized fields (patient_name, patient_phone, patient_email) are retained as snapshot data for historical record-keeping. The canonical patient identity is stored in the `patients` table and referenced via `patient_id`.

Statuses:

- pending
- confirmed
- cancelled

---

## doctor_availability

Fields:

- id (UUID, PK)
- doctor_id (UUID, FK → doctors.id, CASCADE on delete, indexed)
- weekday (ENUM: monday, tuesday, wednesday, thursday, friday, saturday, sunday)
- start_time (VARCHAR 5, HH:MM)
- end_time (VARCHAR 5, HH:MM)
- duration_minutes (INT, default 30, 5-480)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Constraints:

- `uq_doctor_availability_interval`: Unique constraint on (doctor_id, weekday, start_time, end_time)

---

## blocked_dates

Fields:

- id (UUID, PK)
- doctor_id (UUID, FK → doctors.id, CASCADE on delete, indexed)
- blocked_date (DATE)
- reason (VARCHAR 500, nullable)
- created_at (TIMESTAMPTZ)

Constraints:

- `uq_blocked_date_per_doctor`: Unique constraint on (doctor_id, blocked_date)

---

## clinic_settings

Fields:

- id

- clinic_name

- phone

- email

- address

- google_maps_url

- hero_title

- hero_subtitle

- working_hours

- created_at

- updated_at

---

## Entity Relationship Summary

```
users (1) ──optional──> (0..1) patients (1) ──> (0..N) appointments
  |
  └──> (0..1) doctors (1) ──> (0..N) appointments
                    (1) ──> (0..N) doctor_availability
                    (1) ──> (0..N) blocked_dates
```

Key points:

- A User may have zero or one Patient record (if they registered an account)
- A Patient may have zero or one User record (guest patients have no user)
- A Patient may have many Appointments
- A Doctor must have exactly one User
- An Appointment belongs to exactly one Doctor and optionally one Patient
