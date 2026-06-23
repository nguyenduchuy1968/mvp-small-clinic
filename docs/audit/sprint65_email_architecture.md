# Sprint 6.5 — Email Notifications Architecture Audit

**Date:** 2026-06-23  
**Project:** MVP Small Clinic  
**Tag:** `sprint6.4-complete`  
**Timezone:** `Asia/Ho_Chi_Minh`  
**Audit Type:** Architecture-only (no code, no migrations, no commits)

---

## Table of Contents

1. [Architecture Audit](#1-architecture-audit)
2. [SMTP Provider Recommendation](#2-smtp-provider-recommendation)
3. [Notification Flow](#3-notification-flow)
4. [Failure Strategy](#4-failure-strategy)
5. [File-Level Impact Plan](#5-file-level-impact-plan)
6. [Implementation Phases](#6-implementation-phases)
7. [Risks](#7-risks)
8. [Final Recommendation](#8-final-recommendation)

---

## 1. Architecture Audit

### 1.1 Existing Email Libraries

| Library                                       | Version   | File                                               | Purpose                 |
| --------------------------------------------- | --------- | -------------------------------------------------- | ----------------------- |
| [`emails`](backend/pyproject.toml:12)         | `>=0.6`   | [`backend/pyproject.toml`](backend/pyproject.toml) | SMTP email sending      |
| [`jinja2`](backend/pyproject.toml:13)         | `>=3.1.4` | [`backend/pyproject.toml`](backend/pyproject.toml) | HTML template rendering |
| [`email-validator`](backend/pyproject.toml:9) | `>=2.1.0` | [`backend/pyproject.toml`](backend/pyproject.toml) | Email validation        |

**Status:** All required libraries are **already installed**. No new dependencies needed.

### 1.2 Existing SMTP Configuration

Defined in [`backend/app/core/config.py`](backend/app/core/config.py:88-108):

```python
SMTP_TLS: bool = True
SMTP_SSL: bool = False
SMTP_PORT: int = 587
SMTP_HOST: str | None = None
SMTP_USER: str | None = None
SMTP_PASSWORD: str | None = None
EMAILS_FROM_EMAIL: EmailStr | None = None
EMAILS_FROM_NAME: str | None = None
EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

@property
def emails_enabled(self) -> bool:
    return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)
```

**Status:** SMTP configuration is **fully ready**. The `emails_enabled` computed property acts as a feature flag — when `SMTP_HOST` and `EMAILS_FROM_EMAIL` are set, email sending is active. Currently in `.env`, `SMTP_HOST` is empty, so emails are disabled in local dev.

### 1.3 Existing Email Services

The email utility layer lives in [`backend/app/utils.py`](backend/app/utils.py) and provides:

| Function                                                     | Line | Purpose                                                |
| ------------------------------------------------------------ | ---- | ------------------------------------------------------ |
| [`render_email_template()`](backend/app/utils.py:25)         | 25   | Renders Jinja2 templates from `email-templates/build/` |
| [`send_email()`](backend/app/utils.py:33)                    | 33   | Sends email via SMTP using the `emails` library        |
| [`generate_test_email()`](backend/app/utils.py:58)           | 58   | Generates test email data                              |
| [`generate_reset_password_email()`](backend/app/utils.py:68) | 68   | Generates password reset email                         |
| [`generate_new_account_email()`](backend/app/utils.py:85)    | 85   | Generates new account notification                     |

**Status:** The `send_email()` function is synchronous and sends directly during the HTTP request. No background task or queue is used.

### 1.4 Existing Background Task Usage

**None.** The project currently has no background task infrastructure:

- No Celery, Redis Queue, or similar
- No FastAPI `BackgroundTasks` usage
- No task queue configuration in `compose.yml`
- No worker service in Docker Compose

### 1.5 Existing Notification Patterns

The only email notifications currently implemented are:

1. **Password Reset** — [`backend/app/api/routes/login.py`](backend/app/api/routes/login.py:54) — `POST /password-recovery/{email}`
2. **Test Email** — [`backend/app/api/routes/utils.py`](backend/app/api/routes/utils.py:11) — `POST /utils/test-email/`

Both send emails **synchronously** during the HTTP request. There is no appointment-related email notification.

### 1.6 Existing Email Templates

Located in [`backend/app/email-templates/`](backend/app/email-templates/):

| Template                                                                | Source (MJML) | Build (HTML) | Purpose                  |
| ----------------------------------------------------------------------- | ------------- | ------------ | ------------------------ |
| [`test_email`](backend/app/email-templates/src/test_email.mjml)         | MJML          | HTML         | Test email               |
| [`reset_password`](backend/app/email-templates/src/reset_password.mjml) | MJML          | HTML         | Password recovery        |
| [`new_account`](backend/app/email-templates/src/new_account.mjml)       | MJML          | HTML         | New account notification |

**Status:** MJML workflow is established. New templates should follow the same pattern: create `.mjml` source, build to `.html`, render with Jinja2.

---

## 2. SMTP Provider Recommendation

### Evaluation Matrix

| Criteria                   | Gmail SMTP                                                        | Brevo                                  | Resend                                 | Mailgun                               |
| -------------------------- | ----------------------------------------------------------------- | -------------------------------------- | -------------------------------------- | ------------------------------------- |
| **Setup Complexity**       | Medium — requires App Password, "Less secure apps" may be blocked | Low — API key + SMTP                   | Low — API key only                     | Medium — domain verification required |
| **Free Tier**              | Free (existing account)                                           | 300 emails/day                         | 100 emails/day                         | 5,000 emails for 3 months, then paid  |
| **Reliability**            | High for personal, may flag as spam for business                  | High — dedicated transactional service | High — modern API, good deliverability | High — established provider           |
| **Deployment Suitability** | Poor — not designed for transactional email at scale              | Good — purpose-built for transactional | Good — developer-first API             | Good — enterprise-grade               |
| **SMTP Support**           | Yes (smtp.gmail.com)                                              | Yes (smtp-relay.brevo.com)             | Yes (smtp.resend.com)                  | Yes (smtp.mailgun.org)                |
| **API SDK**                | No official Python SDK                                            | Python SDK available                   | Python SDK available                   | Python SDK available                  |
| **OpenAPI/SDK Required?**  | No — SMTP only                                                    | No — SMTP works                        | No — SMTP works                        | No — SMTP works                       |

### Recommendation: **Brevo** (formerly Sendinblue)

**Rationale for MVP Small Clinic:**

1. **Setup Complexity — Low.** Sign up, verify domain (or use free sender email), copy SMTP credentials into `.env`. No DNS changes required for basic operation.

2. **Free Tier — 300 emails/day.** For a small clinic with 1-2 doctors seeing maybe 10-20 patients per day, this is **more than sufficient**. 300 emails/day covers:
   - Patient confirmation emails
   - Doctor notification emails
   - Password reset emails
   - Test emails
   - Buffer for peak days

3. **Reliability — High.** Brevo is a mature transactional email provider with good deliverability to Vietnamese email providers (Gmail, Outlook, Yahoo, etc.), which is important for the target market (Asia/Ho_Chi_Minh timezone).

4. **Deployment Suitability — Excellent.** Works with the existing SMTP infrastructure. No code changes to the `send_email()` function. Just set environment variables:

   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<brevo-api-key>
   SMTP_PASSWORD=<brevo-smtp-key>
   EMAILS_FROM_EMAIL=clinic@example.com
   EMAILS_FROM_NAME="MVP Small Clinic"
   SMTP_TLS=True
   SMTP_SSL=False
   ```

5. **Why not the others?**
   - **Gmail SMTP:** Requires App Password, 2FA must be enabled, Google may block "less secure" access. Not suitable for production transactional email.
   - **Resend:** Excellent developer experience, but 100 emails/day free tier is tight for a clinic that may send 2 emails per booking (patient + doctor).
   - **Mailgun:** Requires domain verification (DNS changes), free tier is time-limited (3 months). Overkill for MVP.

---

## 3. Notification Flow

### 3.1 Trigger Points

The appointment lifecycle has these state transitions:

```
Booking Created (POST /appointments)
  ├── Patient → Booking Confirmation Email
  └── Doctor  → New Appointment Notification Email

Status Update (PATCH /appointments/{id}/status)
  ├── PENDING → CONFIRMED: No email (already confirmed via auto-confirm)
  ├── PENDING → CANCELLED: No email (out of scope for Sprint 6.5)
  └── CONFIRMED → CANCELLED: No email (out of scope for Sprint 6.5)

Appointment Deleted (DELETE /appointments/{id})
  └── No email (admin action, out of scope)
```

### 3.2 Recommended MVP Scope

**Phase 1 (Sprint 6.5):**

- **Trigger:** `POST /appointments` (Booking Created)
- **Patient Email:** Booking Confirmation — **always sent**
- **Doctor Email:** New Appointment Notification — **always sent**

**Out of Scope for Sprint 6.5:**

- Cancellation notifications
- Status change notifications
- Email reminders (pre-appointment)
- Rescheduling notifications

### 3.3 Flow Diagram

```
Patient submits booking form
        │
        ▼
POST /api/v1/appointments
        │
        ▼
crud.create_appointment()
  ├── Validate doctor, date, time, contact, double-booking
  ├── Create appointment record
  ├── Generate booking number
  └── Commit to database
        │
        ▼
Return AppointmentPublic to frontend
        │
        ▼
Send emails (via BackgroundTasks — primitives only, no ORM objects)
  ├── send_patient_confirmation_email(
  │       appointment_id, patient_email, patient_name,
  │       doctor_name, appointment_date, appointment_time,
  │       booking_number
  │   )
  │     ├── Render booking_confirmation.html template
  │     ├── Send via SMTP to patient_email
  │     └── Log result
  │
  └── send_doctor_notification_email(
          appointment_id, doctor_email, patient_name,
          patient_phone, appointment_date, appointment_time,
          booking_number
      )
        ├── Render new_appointment.html template
        ├── Send via SMTP to doctor_email
        └── Log result
```

### 3.4 Email Recipient Resolution

| Email                | Recipient                       | Source                                                     |
| -------------------- | ------------------------------- | ---------------------------------------------------------- |
| Patient Confirmation | `appointment.patient_email`     | From booking form                                          |
| Doctor Notification  | `appointment.doctor.user.email` | Via relationship: `Appointment.doctor → Doctor.user.email` |

**Edge case:** If `patient_email` is null (e.g., contact method is PHONE), the patient confirmation email cannot be sent. This should be handled gracefully — log a warning, do not crash.

---

## 4. Failure Strategy

### 4.1 Options Evaluated

#### Option A — Booking Fails on Email Failure

```
create_appointment()
  ├── Validate + Create + Commit
  ├── Send email
  │     └── If email fails → rollback appointment → return 500
  └── Return success
```

**Pros:**

- Atomic: no appointment without notification
- Simple to reason about

**Cons:**

- **Unacceptable UX:** A patient fills out a form, gets a 500 error, and loses their booking because of an SMTP timeout
- SMTP is unreliable — transient failures (network blips, rate limits, provider downtime) should not block patient care
- Violates the principle: "Every feature must help acquire paying customers quickly"

#### Option B — Booking Succeeds, Email Failure Logged (Recommended)

```
create_appointment()
  ├── Validate + Create + Commit → Return 201
  │
  └── (async) Send email
        ├── Success → log info
        └── Failure → log error (Sentry if configured)
```

**Pros:**

- **Booking always succeeds** — patient gets their appointment
- Email failure is non-blocking
- Failures are visible in logs and Sentry for manual follow-up
- Simple to implement with FastAPI `BackgroundTasks`

**Cons:**

- Patient may not receive confirmation (mitigated by in-app confirmation UX)
- Doctor may miss a notification (mitigated by doctor dashboard)

### 4.2 Recommendation: **Option B — Booking Succeeds, Email Failure Logged**

**Why:**

1. **MVP Principle:** The primary goal is booking appointments. Email is a nice-to-have notification layer, not a booking prerequisite.
2. **UX Reality:** The patient already sees a success screen with booking details in the browser. The email is a convenience, not the primary confirmation channel.
3. **Operational Reality:** For a small clinic, the doctor can always check their dashboard for new appointments. A missed email is not a missed patient.
4. **Simplicity:** No need for retry queues, dead-letter queues, or complex error handling in Sprint 6.5.

### 4.3 Error Handling Strategy

```python
def send_email_safe(
    *,
    email_to: str,
    subject: str,
    html_content: str,
    email_type: str = "unknown",
    appointment_id: str | None = None,
) -> None:
    """Send email with safe failure handling.

    Never raises — always logs outcome with structured context.
    """
    if not settings.emails_enabled:
        logger.warning(
            "Email disabled | type=%s to=%s appointment_id=%s subject=%s",
            email_type, email_to, appointment_id, subject,
        )
        return
    try:
        send_email(email_to=email_to, subject=subject, html_content=html_content)
        logger.info(
            "Email sent | type=%s to=%s appointment_id=%s",
            email_type, email_to, appointment_id,
        )
    except Exception:
        logger.exception(
            "Email failed | type=%s to=%s appointment_id=%s",
            email_type, email_to, appointment_id,
        )
        # If Sentry is configured, the exception is automatically captured
```

---

## 5. File-Level Impact Plan

### 5.1 Backend — New Files

| #   | File                                                                                                | Purpose                              | Complexity      |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------- |
| 1   | [`backend/app/email-templates/src/booking_confirmation.mjml`](backend/app/email-templates/src/)     | MJML source for patient confirmation | Low             |
| 2   | [`backend/app/email-templates/src/new_appointment.mjml`](backend/app/email-templates/src/)          | MJML source for doctor notification  | Low             |
| 3   | [`backend/app/email-templates/build/booking_confirmation.html`](backend/app/email-templates/build/) | Built HTML for patient confirmation  | Low (generated) |
| 4   | [`backend/app/email-templates/build/new_appointment.html`](backend/app/email-templates/build/)      | Built HTML for doctor notification   | Low (generated) |

### 5.2 Backend — Modified Files

| #   | File                                                                               | Change                                                                                               | Complexity |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| 5   | [`backend/app/utils.py`](backend/app/utils.py)                                     | Add `generate_booking_confirmation_email()`, `generate_new_appointment_email()`, `send_email_safe()` | Low        |
| 6   | [`backend/app/api/routes/appointments.py`](backend/app/api/routes/appointments.py) | Add `BackgroundTasks` parameter to `create_appointment()`, call email functions after creation       | Low        |
| 7   | [`backend/app/crud.py`](backend/app/crud.py)                                       | No change — email sending is an API-layer concern, not CRUD                                          | None       |

### 5.3 Frontend — Modified Files

| #   | File                                                                                     | Change                                                     | Complexity |
| --- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| 8   | [`frontend/src/client/types.gen.ts`](frontend/src/client/types.gen.ts)                   | Re-generate (no schema change expected, but good practice) | Low        |
| 9   | [`frontend/src/i18n/locales/en/booking.json`](frontend/src/i18n/locales/en/booking.json) | Add email-related confirmation messages (optional)         | Low        |
| 10  | [`frontend/src/i18n/locales/vi/booking.json`](frontend/src/i18n/locales/vi/booking.json) | Vietnamese translations                                    | Low        |
| 11  | [`frontend/src/i18n/locales/uk/booking.json`](frontend/src/i18n/locales/uk/booking.json) | Ukrainian translations                                     | Low        |

### 5.4 Configuration — Modified Files

| #   | File                         | Change                                                        | Complexity |
| --- | ---------------------------- | ------------------------------------------------------------- | ---------- |
| 12  | [`.env`](.env)               | Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` for Brevo       | Low        |
| 13  | [`compose.yml`](compose.yml) | No change — SMTP env vars already passed to backend container | None       |

### 5.5 Tests — New Files

| #   | File                                                   | Purpose                                                                             | Complexity |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------- |
| 14  | `backend/tests/api/routes/test_email_notifications.py` | Test email generation functions, test that emails are queued (not sent during test) | Medium     |

### 5.6 Tests — Modified Files

| #   | File                                                                                             | Change                                                                                   | Complexity |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------- |
| 15  | [`backend/tests/api/routes/test_appointments.py`](backend/tests/api/routes/test_appointments.py) | Verify that `create_appointment` response still works; no email-sending assertion needed | Low        |

### 5.7 OpenAPI

| #   | File                          | Change                                                          | Complexity |
| --- | ----------------------------- | --------------------------------------------------------------- | ---------- |
| 16  | OpenAPI spec (auto-generated) | No schema changes — email is a side effect, not an API resource | None       |

### 5.8 Summary Table

| Section       | New Files | Modified Files | Total  |
| ------------- | --------- | -------------- | ------ |
| Backend       | 4         | 2              | 6      |
| Frontend      | 0         | 4              | 4      |
| Configuration | 0         | 1              | 1      |
| Tests         | 1         | 1              | 2      |
| **Total**     | **5**     | **8**          | **13** |

---

## 6. Implementation Phases

### Phase 1: Infrastructure (Estimated: 1-2 hours)

**Goal:** Set up email sending capability with Brevo.

**Steps:**

1. Sign up for Brevo (free tier)
2. Verify sender email address
3. Generate SMTP key
4. Update [`.env`](.env) with Brevo credentials:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<brevo-login-email>
   SMTP_PASSWORD=<brevo-smtp-key>
   EMAILS_FROM_EMAIL=clinic@example.com
   EMAILS_FROM_NAME="MVP Small Clinic"
   SMTP_TLS=True
   SMTP_SSL=False
   ```
5. Verify with `POST /api/v1/utils/test-email/`

**Complexity:** Low  
**Risk:** Low — no code changes, purely configuration

---

### Phase 2: Email Templates (Estimated: 2-3 hours)

**Goal:** Create MJML email templates for both notification types.

**Steps:**

1. Create [`booking_confirmation.mjml`](backend/app/email-templates/src/booking_confirmation.mjml) with:
   - Clinic name header
   - "Booking Confirmed" message
   - Booking number (prominent)
   - Doctor name
   - Appointment date
   - Appointment time
   - Clinic contact information
   - Footer with "If you have questions, call the clinic"

2. Create [`new_appointment.mjml`](backend/app/email-templates/src/new_appointment.mjml) with:
   - Clinic name header
   - "New Appointment" alert
   - Patient name
   - Patient phone
   - Appointment date
   - Appointment time
   - Booking number
   - Link to doctor dashboard

3. Build MJML → HTML (using `mjml` CLI or online compiler)

4. Add Jinja2 rendering functions in [`backend/app/utils.py`](backend/app/utils.py) — these are pure data transformers, no ORM dependency:
   - `generate_booking_confirmation_email(patient_name, doctor_name, appointment_date, appointment_time, booking_number)`
   - `generate_new_appointment_email(patient_name, patient_phone, appointment_date, appointment_time, booking_number)`

**Complexity:** Low  
**Risk:** Low — follows existing MJML pattern

---

### Phase 3: Patient Email (Estimated: 2-3 hours)

**Goal:** Send booking confirmation email to patient after successful booking.

**Steps:**

1. Add `from fastapi import BackgroundTasks` to [`backend/app/api/routes/appointments.py`](backend/app/api/routes/appointments.py)
2. Add `background_tasks: BackgroundTasks` parameter to `create_appointment()` endpoint
3. After successful appointment creation, add background task with **primitives only** (no ORM objects):
   ```python
   background_tasks.add_task(
       send_patient_confirmation_email,
       appointment_id=str(appointment.id),
       patient_email=appointment.patient_email,
       patient_name=appointment.patient_name,
       doctor_name=appointment.doctor_name,
       appointment_date=appointment.appointment_date.isoformat(),
       appointment_time=appointment.appointment_time,
       booking_number=appointment.booking_number,
   )
   ```
4. Implement `send_patient_confirmation_email()` in [`backend/app/utils.py`](backend/app/utils.py) accepting only primitive parameters:
   ```python
   def send_patient_confirmation_email(
       *,
       appointment_id: str,
       patient_email: str | None,
       patient_name: str,
       doctor_name: str,
       appointment_date: str,
       appointment_time: str,
       booking_number: str,
   ) -> None:
       if not patient_email:
           logger.warning(
               f"No patient email for appointment {appointment_id}, "
               f"skipping confirmation email"
           )
           return
       subject = f"Booking Confirmed - {booking_number}"
       html_content = render_email_template(
           template_name="booking_confirmation.html",
           context={
               "patient_name": patient_name,
               "doctor_name": doctor_name,
               "appointment_date": appointment_date,
               "appointment_time": appointment_time,
               "booking_number": booking_number,
           },
       )
       send_email_safe(
           email_to=patient_email,
           subject=subject,
           html_content=html_content,
           email_type="patient_confirmation",
           appointment_id=appointment_id,
       )
   ```

**Complexity:** Low  
**Risk:** Low — `BackgroundTasks` is built into FastAPI, no external dependencies

---

### Phase 4: Doctor Email (Estimated: 2-3 hours)

**Goal:** Send notification email to doctor after new booking.

**Steps:**

1. Resolve doctor email **while the DB session is still active**, then add background task with primitives only:

   ```python
   # Resolve doctor email before session closes
   doctor = session.get(Doctor, appointment_in.doctor_id)
   doctor_email = doctor.user.email if doctor and doctor.user else None

   background_tasks.add_task(
       send_doctor_notification_email,
       appointment_id=str(appointment.id),
       doctor_email=doctor_email,
       patient_name=appointment.patient_name,
       patient_phone=appointment.patient_phone,
       appointment_date=appointment.appointment_date.isoformat(),
       appointment_time=appointment.appointment_time,
       booking_number=appointment.booking_number,
   )
   ```

2. Implement `send_doctor_notification_email()` in [`backend/app/utils.py`](backend/app/utils.py) accepting only primitive parameters:
   ```python
   def send_doctor_notification_email(
       *,
       appointment_id: str,
       doctor_email: str | None,
       patient_name: str,
       patient_phone: str,
       appointment_date: str,
       appointment_time: str,
       booking_number: str,
   ) -> None:
       if not doctor_email:
           logger.warning(
               f"No doctor email for appointment {appointment_id}, "
               f"skipping notification email"
           )
           return
       subject = f"New Appointment - {booking_number}"
       html_content = render_email_template(
           template_name="new_appointment.html",
           context={
               "patient_name": patient_name,
               "patient_phone": patient_phone,
               "appointment_date": appointment_date,
               "appointment_time": appointment_time,
               "booking_number": booking_number,
           },
       )
       send_email_safe(
           email_to=doctor_email,
           subject=subject,
           html_content=html_content,
           email_type="doctor_notification",
           appointment_id=appointment_id,
       )
   ```

**Complexity:** Low  
**Risk:** Low — same pattern as Phase 3

---

### Phase 5: Testing (Estimated: 3-4 hours)

**Goal:** Ensure email notifications work correctly without actually sending emails in tests.

**Steps:**

1. Create [`backend/tests/api/routes/test_email_notifications.py`](backend/tests/api/routes/test_email_notifications.py):
   - Test `generate_booking_confirmation_email()` output contains expected fields
   - Test `generate_new_appointment_email()` output contains expected fields
   - Test `send_email_safe()` logs warning when emails are disabled
   - Test that `create_appointment` endpoint works with `BackgroundTasks` (no crash)
   - Test that email is NOT sent when `patient_email` is None (graceful skip)

2. Update [`backend/tests/api/routes/test_appointments.py`](backend/tests/api/routes/test_appointments.py):
   - No functional changes needed
   - Verify existing tests still pass

**Complexity:** Medium  
**Risk:** Low — email sending is side-effect-only, existing booking logic unchanged

---

## 7. Risks

| Risk                                    | Probability | Impact | Mitigation                                                                  |
| --------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------- |
| SMTP credentials exposed in `.env`      | Low         | High   | Add `.env` to `.gitignore` (already done), use Docker secrets in production |
| Brevo free tier rate limit (300/day)    | Low         | Medium | Monitor usage; upgrade to paid tier if clinic grows beyond 150 bookings/day |
| Patient email bounces (invalid address) | Medium      | Low    | Logged as error; patient still sees confirmation on screen                  |
| Doctor email goes to spam               | Medium      | Medium | Configure SPF/DKIM for Brevo sending domain; add "Add to address book" note |
| BackgroundTasks fail silently           | Low         | Medium | Logging + Sentry capture; doctor can still see appointment in dashboard     |
| MJML build step forgotten               | Low         | Low    | Add build step to `prestart.sh` or document in CONTRIBUTING.md              |
| Email template rendering error          | Low         | Low    | `send_email_safe()` catches all exceptions; booking still succeeds          |
| `patient_email` is null (phone contact) | Medium      | Low    | Graceful skip with warning log; no crash                                    |

---

## 8. Final Recommendation

### Summary

The MVP Small Clinic already has **all the infrastructure needed** for email notifications:

- ✅ `emails` library installed
- ✅ `jinja2` template engine installed
- ✅ SMTP configuration in `Settings`
- ✅ `send_email()` function ready
- ✅ MJML template workflow established
- ✅ Docker Compose passes SMTP env vars

### What's Needed

1. **Sign up for Brevo** (free tier, 300 emails/day)
2. **Create 2 MJML email templates** (patient confirmation, doctor notification)
3. **Add 2 utility functions** in [`backend/app/utils.py`](backend/app/utils.py)
4. **Add `BackgroundTasks`** to the `create_appointment` endpoint
5. **Write tests** for the new functionality

### Key Architectural Decisions

| Decision                | Choice                                     | Rationale                                                               |
| ----------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| SMTP Provider           | **Brevo**                                  | Best free tier for MVP, works with existing SMTP code                   |
| Background Processing   | **FastAPI BackgroundTasks**                | Simplest approach, no external dependencies, sufficient for 1-2 doctors |
| Failure Strategy        | **Booking succeeds, email failure logged** | Patient experience is priority; email is convenience, not critical path |
| Email Templates         | **MJML + Jinja2**                          | Follows existing pattern, responsive HTML emails                        |
| Patient Email Condition | **Only if `patient_email` is provided**    | Graceful skip for phone-only contact methods                            |

### Estimated Total Effort

| Phase                   | Hours     | Dependencies  |
| ----------------------- | --------- | ------------- |
| Phase 1: Infrastructure | 1-2       | Brevo account |
| Phase 2: Templates      | 2-3       | None          |
| Phase 3: Patient Email  | 2-3       | Phase 2       |
| Phase 4: Doctor Email   | 2-3       | Phase 2       |
| Phase 5: Testing        | 3-4       | Phases 3-4    |
| **Total**               | **10-15** |               |

### Go/No-Go Criteria

**Go** if:

- Brevo account is created and SMTP key is obtained
- Test email sends successfully via `POST /utils/test-email/`
- All existing tests pass after changes

**No-Go** if:

- Brevo free tier is not available in the target region (Vietnam)
- SMTP port 587 is blocked by the deployment environment

---

_End of Sprint 6.5 Email Architecture Audit_
