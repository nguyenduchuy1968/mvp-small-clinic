# Architecture

## Architecture Style

Modular Monolith

Reason:

- Fast development
- Simple deployment
- Easy maintenance
- Suitable for small clinics

---

## Backend Layers

API Layer

Responsibilities:

- Receive requests
- Validate input
- Return responses

---

Service Layer

Responsibilities:

- Business logic
- Booking rules
- Patient resolution (find-or-create)
- Duplicate prevention (phone/email)
- Availability checks
- Notification triggering

---

CRUD Layer

Responsibilities:

- Database access
- Queries
- Persistence

---

Database Layer

PostgreSQL

---

## Core Modules

Auth

Doctors

Patients — Central identity of the booking system. A Patient may exist without a User account (guest booking, reception-created). When a patient registers, Patient.user_id is linked to the User account. Appointments belong to the Patient record, never directly to the User.

Services

Appointments

Availability

Clinic Settings

AI Assistant

Notifications

---

## Patient Identity Architecture

The Patient model is the central identity of the booking system.

```
User (authentication) ──optional──> Patient (identity) ──> Appointments
```

Key design decisions:

1. **Patient.user_id is nullable**: A Patient can exist without a User account (guest booking, reception-created).
2. **Patient → User (nullable FK)**: The foreign key flows from Patient to User, not the other way around. This allows patients to exist independently of authentication.
3. **Duplicate prevention**: When creating appointments, the system searches for existing patients by phone (normalized) then email. If found, the existing Patient is reused. If not found, a new Patient is created.
4. **Account registration links patients**: When a guest registers an account, the system searches for an existing Patient by email and links it to the new User account. All existing appointments remain accessible.
5. **Denormalized contact fields on Appointment**: The Appointment model retains `patient_name`, `patient_phone`, and `patient_email` as snapshot data for historical record-keeping, even though the canonical patient identity is in the Patient model.

### Patient Resolution Flow (Appointment Creation)

```
1. Extract patient_name, patient_phone, patient_email from request
2. Normalize phone (strip separators: spaces, dashes, dots, parens)
3. Search by phone (raw + normalized)
4. If found → reuse existing Patient
5. If not found → search by email
6. If found → reuse existing Patient
7. If not found → create new Patient
8. Set appointment.patient_id = patient.id
```

### Account Registration Flow

```
1. Check for existing User by email
2. Search for existing Patient by email
3. Create User
4. If Patient found → link Patient.user_id = user.id
5. If Patient not found → create new Patient with user_id = user.id
```

### Patient Account Activation Flow (POST /api/v1/patient-accounts/activate)

This endpoint activates an online account for an existing Patient record that does not yet have a linked User. It is used when a patient who previously booked as a guest (or was created by reception) wants to create a login account.

```
1. Validate passwords match → 400 if not
2. Find Patient by phone → 404 if not found
3. Verify email matches Patient record → 400 if mismatch
4. Verify Patient.user_id IS NULL → 400 if already activated
5. Check for existing User by email → 400 if exists
6. Create User with hashed password (full_name copied from Patient)
7. Link Patient.user_id = User.id
8. Generate JWT access token
9. Return { access_token, token_type, patient }
```

Key design decisions:

1. **Phone is the lookup key**: Patients are found by phone (the most reliable identifier for existing patients). Email is then verified as a secondary check.
2. **Never creates duplicate Patients**: The endpoint only links an existing Patient to a new User. It never creates a new Patient record.
3. **Immediate JWT issuance**: After activation, the patient receives a JWT token so they are immediately logged in without a separate login step.
4. **Full_name is copied**: When creating the User, `full_name` is copied from the Patient record to ensure consistency.
5. **Email uniqueness enforced**: The endpoint checks that no existing User already uses the provided email, preventing duplicate accounts.

---

## Notification Architecture

Notification Service

Providers:

- Email
- Telegram (future)
- Zalo (future)
- SMS (future)

---

## AI Architecture

AI = Conversation Layer

Backend = Business Logic

AI never creates appointments directly.

AI calls backend services.

---

## Deployment

Frontend Container

Backend Container

PostgreSQL Container

Docker Compose
