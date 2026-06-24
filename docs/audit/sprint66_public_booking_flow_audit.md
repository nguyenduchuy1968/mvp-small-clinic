# Sprint 6.6 — Public Booking Flow Audit

**Date:** 2026-06-23
**Scope:** Complete public booking flow from patient perspective
**Method:** Static code review of all booking-related components, routes, hooks, backend endpoints, email templates

---

## Patient Journey Map

```
Home Page (no public landing — user must know /booking URL)
  ↓
Doctor Selection (Step 1)
  ↓
Date Selection (Step 2)
  ↓
Time Slot Selection (Step 3)
  ↓
Patient Information Form (Step 4)
  ↓
Booking Confirmation (Step 5)
  ↓
Email Confirmation (background task)
```

---

## 1. Click Count Analysis

### Current Flow (minimum clicks)

| Step      | Action                                         | Clicks                     |
| --------- | ---------------------------------------------- | -------------------------- |
| 0         | Navigate to `/booking`                         | 1 (URL entry or link)      |
| 1         | Select a doctor card                           | 1                          |
| 2         | Select a date (native date input + click date) | 2                          |
| 3         | Select a time slot                             | 1                          |
| 4         | Fill form + click "Book Appointment"           | 1+ (typing + click)        |
| 5         | View confirmation                              | 0 (auto)                   |
| **Total** |                                                | **6+ clicks + data entry** |

### Issues Identified

1. **Date selection requires 2 clicks** — user must open the native date picker, then click a date. Quick options (Today/Tomorrow) help but only cover 2 days.
2. **No "Skip" for single-doctor clinics** — if only 1 doctor exists, the user still sees a selection screen with 1 card they must click.
3. **No auto-advance** — after selecting a time slot, user must manually click "Next" (actually the wizard auto-advances on select, but the form step requires explicit button click).
4. **Form submission is indirect** — the "Book Appointment" button in the footer uses `document.querySelector("form").requestSubmit()` instead of being inside the form, which is fragile.

---

## 2. Mobile UX Audit

### Breakpoint Analysis

#### 320px (small phone)

| Component                                                                        | Issue                                                                                                                      | Severity |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| [`DoctorCard`](frontend/src/components/Booking/DoctorCard.tsx)                   | Grid `sm:grid-cols-2 lg:grid-cols-3` collapses to 1 column — acceptable                                                    | ✅ OK    |
| [`StepIndicator`](frontend/src/components/Booking/StepIndicator.tsx)             | Labels hidden via `hidden sm:block` — only numbers visible. Connector lines are `w-8 sm:w-12` which is very tight at 320px | ⚠️ Tight |
| [`TimeSlotGrid`](frontend/src/components/Booking/TimeSlotGrid.tsx)               | Grid `grid-cols-3` at mobile — 3 columns of small buttons may cause overflow on 320px                                      | ⚠️ Tight |
| [`DatePicker`](frontend/src/components/Booking/DatePicker.tsx)                   | Native `<input type="date">` — works but varies by browser                                                                 | ✅ OK    |
| [`PatientInfoForm`](frontend/src/components/Booking/PatientInfoForm.tsx)         | Grid `sm:grid-cols-2` collapses to 1 column — acceptable                                                                   | ✅ OK    |
| [`BookingConfirmation`](frontend/src/components/Booking/BookingConfirmation.tsx) | `max-w-lg` with padding — should fit                                                                                       | ✅ OK    |

#### 375px (iPhone SE/13 mini)

- Step indicator circles (32px) + connector lines (32px) = 64px per step. 5 steps = 320px minimum. At 375px with padding, this **barely fits**.
- Time slot buttons at `grid-cols-3` with `gap-2` = approximately 100px per button. Acceptable.

#### 390px (iPhone 14/15)

- All components should render correctly.

#### 430px (iPhone 14/15 Pro Max)

- All components render correctly.

### Mobile-Specific Issues

1. **Step indicator overflow risk** — at 320px, the 5-step indicator with connector lines may overflow horizontally. The circles are 32px + connectors at 32px (w-8) = 64px per step × 5 = 320px, leaving zero margin.
2. **Time slot buttons small on 320px** — `grid-cols-3` with `gap-2` on a 320px viewport gives ~92px per button. The text (e.g., "09:00") fits, but touch target may be below recommended 44px height.
3. **No mobile-specific layout** — the booking page uses the same layout for all breakpoints. No bottom-sheet or full-screen modal patterns for mobile.
4. **No swipe gestures** — mobile users cannot swipe between steps.

---

## 3. Doctor Selection Evaluation

### Current Implementation

- [`DoctorCard`](frontend/src/components/Booking/DoctorCard.tsx) shows: full_name, specialty, experience_years, bio (2-line clamp)
- Grid layout: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- Clicking a card auto-advances to Step 2

### Issues

1. **No "Skip" for single-doctor clinics** — if `doctorsData.data.length === 1`, the user still sees a full card and must click it. This is an unnecessary step.
2. **No doctor photos** — `photo_url` exists in the model but is not displayed. Photos help patients recognize their doctor.
3. **No search/filter** — if the clinic has many doctors, there's no way to search or filter.
4. **No loading skeleton** — just a text "Loading..." message.

### Recommendation

- **Single-doctor shortcut**: If `doctorsData.data.length === 1`, auto-select the doctor and advance to Step 2 (or even combine with date selection).
- **Display photo_url** when available.

---

## 4. Patient Form Review

### Fields

| Field            | Required    | Validation                                        | Issue                                         |
| ---------------- | ----------- | ------------------------------------------------- | --------------------------------------------- |
| `patient_name`   | ✅ Yes      | `min(1)` — any non-empty string                   | ✅ OK                                         |
| `patient_phone`  | ✅ Yes      | `min(1)` — any non-empty string                   | ⚠️ **No phone format validation**             |
| `patient_email`  | ❌ Optional | `z.string().email().optional().or(z.literal(''))` | ⚠️ **Empty string bypasses email validation** |
| `contact_method` | ❌ Optional | Default: `phone`                                  | ✅ OK                                         |
| `notes`          | ❌ Optional | None                                              | ✅ OK                                         |

### Issues

1. **No phone format validation** — `patient_phone` accepts any string of length ≥ 1. No regex, no country code check, no min/max length. This will lead to invalid phone numbers in the database.
2. **Email validation bypass** — `z.string().email().optional().or(z.literal(''))` means an empty string passes validation. But the schema also accepts `undefined`. The backend receives `patient_email: null` when empty, which is fine, but the frontend doesn't validate email format strictly when a value IS entered.
3. **No contact method dependency** — if user selects "Email" as contact method, email should be required. Currently it's optional regardless.
4. **No confirmation field** — no "Confirm Email" or "Confirm Phone" field to catch typos.
5. **Form mode is `onBlur`** — validation only fires when the field loses focus, not on keystroke. This means users may submit with invalid data if they don't tab through all fields.
6. **Indirect form submission** — the submit button is outside the `<form>` element (in [`BookingWizard`](frontend/src/components/Booking/BookingWizard.tsx:207-208)), using `document.querySelector("form").requestSubmit()`. This is fragile and breaks if the form element changes.

---

## 5. Error Handling Review

### Error Scenarios

| Scenario                        | User-Facing Message                                                    | Source                                                                             | Issue                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Slot already booked**         | `"This slot was just booked. Please select another time."`             | [`BookingWizard.tsx:96-98`](frontend/src/components/Booking/BookingWizard.tsx:96)  | ✅ Good — clear, actionable, returns to time selection                                         |
| **Invalid phone (backend)**     | Generic `"An error occurred"`                                          | [`BookingWizard.tsx:104`](frontend/src/components/Booking/BookingWizard.tsx:104)   | ⚠️ **Generic fallback** — backend returns specific validation errors but they may not be shown |
| **Invalid email (backend)**     | Same generic fallback                                                  | Same                                                                               | ⚠️ Same issue                                                                                  |
| **Network error**               | Generic `"An error occurred"`                                          | Same                                                                               | ⚠️ Same issue                                                                                  |
| **No doctors**                  | `"No doctors available"`                                               | [`BookingWizard.tsx:134`](frontend/src/components/Booking/BookingWizard.tsx:134)   | ✅ Clear                                                                                       |
| **No slots (weekend)**          | `"Doctor does not work on weekends. Please choose a weekday."`         | [`TimeSlotGrid.tsx:77-83`](frontend/src/components/Booking/TimeSlotGrid.tsx:77)    | ✅ Good — specific and actionable                                                              |
| **No slots (no schedule)**      | `"No working schedule has been configured for this day."`              | [`TimeSlotGrid.tsx:85-93`](frontend/src/components/Booking/TimeSlotGrid.tsx:85)    | ✅ Clear                                                                                       |
| **No slots (unavailable)**      | `"The doctor is unavailable on this day. Please choose another date."` | [`TimeSlotGrid.tsx:95-103`](frontend/src/components/Booking/TimeSlotGrid.tsx:95)   | ✅ Good                                                                                        |
| **No slots (fully booked)**     | `"All appointment slots for this day have already been booked."`       | [`TimeSlotGrid.tsx:105-113`](frontend/src/components/Booking/TimeSlotGrid.tsx:105) | ✅ Clear                                                                                       |
| **Duplicate booking (DB race)** | `"This slot was just booked. Please select another time."`             | Handled via 409 status                                                             | ✅ Good                                                                                        |

### Issues

1. **Generic error fallback** — when the backend returns a validation error (e.g., invalid phone format), the frontend tries to extract `errDetail` but falls back to `t("common:states.error", "An error occurred")`. This hides specific validation messages.
2. **No client-side phone/email validation** — errors that could be caught before submission are only caught server-side.
3. **No retry mechanism** — if the API call fails due to network issues, the user sees an error toast but has no "Retry" button. They must fill the form again.

---

## 6. Success Page Review

### Current Implementation

[`BookingConfirmation`](frontend/src/components/Booking/BookingConfirmation.tsx) shows:

- Green success card with checkmark icon
- Doctor name, date, time
- Booking reference number (mono, large, primary color)
- Attention alert with email notice
- "Book Another Appointment" button

### Issues

1. **No copy-to-clipboard** — the booking reference number is displayed prominently but cannot be copied with one tap. User must long-press and select text.
2. **No "Add to Calendar"** — no `.ics` file download or Google Calendar / Apple Calendar link.
3. **No clinic address/location** — the confirmation doesn't show the clinic address, which the patient needs to know where to go.
4. **No cancellation instructions** — no information on how to cancel or reschedule.
5. **No SMS confirmation notice** — only mentions email. If the patient chose phone contact method, they may expect SMS.
6. **"Book Another Appointment" uses `window.location.href`** — this is a full page reload which is unnecessary with client-side routing. It works but is not idiomatic React.
7. **Confirmation route (`/booking/confirmation`) requires authentication** — the [`readAppointment`](backend/app/api/routes/appointments.py:287-312) endpoint requires a logged-in user. If the patient tries to revisit their confirmation page, they'll get a 403 error. This is a **critical bug** — the confirmation page is effectively broken for unauthenticated patients.

---

## 7. Email Workflow Review

### Patient Email (`booking_confirmation.html`)

| Content             | Present            | Issue                                                                                      |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| Booking reference   | ✅ Yes             |                                                                                            |
| Doctor name         | ✅ Yes             |                                                                                            |
| Appointment date    | ✅ Yes             |                                                                                            |
| Appointment time    | ✅ Yes             |                                                                                            |
| Doctor phone        | ✅ Yes             |                                                                                            |
| Doctor email        | ✅ Yes             |                                                                                            |
| Clinic address      | ❌ No              | **Missing** — patient doesn't know where to go                                             |
| Calendar attachment | ❌ No              | **Missing** — no .ics file                                                                 |
| Cancellation link   | ❌ No              | **Missing** — no way to cancel from email                                                  |
| Reschedule link     | ❌ No              | **Missing**                                                                                |
| Map link            | ❌ No              | **Missing**                                                                                |
| Language            | 🇻🇳 Vietnamese only | **Hardcoded Vietnamese** — even though the app supports English, Ukrainian, and Vietnamese |

### Doctor Email (`doctor_new_appointment.html`)

| Content           | Present            | Issue                                                      |
| ----------------- | ------------------ | ---------------------------------------------------------- |
| Patient name      | ✅ Yes             |                                                            |
| Patient phone     | ✅ Yes             |                                                            |
| Patient email     | ✅ Yes             |                                                            |
| Booking reference | ✅ Yes             |                                                            |
| Appointment date  | ✅ Yes             |                                                            |
| Appointment time  | ✅ Yes             |                                                            |
| Patient notes     | ❌ No              | **Missing** — doctor doesn't see patient's notes           |
| Contact method    | ❌ No              | **Missing** — doctor doesn't know preferred contact method |
| Language          | 🇻🇳 Vietnamese only | Same hardcoded Vietnamese issue                            |

### Issues

1. **Emails are hardcoded in Vietnamese** — the subject lines and all content are in Vietnamese regardless of the patient's selected language. This is a significant UX gap for English or Ukrainian-speaking patients.
2. **No clinic address in patient email** — the patient receives appointment details but no location information.
3. **No calendar attachment** — no `.ics` file for one-click add to calendar.
4. **No cancellation/reschedule link** — the patient has no way to manage their booking from the email.
5. **Doctor email missing patient notes** — if the patient added notes, the doctor doesn't see them.
6. **Doctor email missing contact method** — the doctor doesn't know whether to call, email, or WhatsApp the patient.

---

## Top 10 UX Frictions

| Rank   | Friction                                                                                                                                                                                                                                                                                        | Severity    | Area                 | Effort |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------- | ------ |
| **1**  | **Confirmation page requires authentication** — patients who book without logging in cannot view their confirmation page at `/booking/confirmation?appointmentId=...` because `readAppointment` requires auth. This is a critical bug that breaks the entire flow for unauthenticated patients. | 🔴 Critical | Success Page         | 2h     |
| **2**  | **Emails hardcoded in Vietnamese** — all email templates are Vietnamese-only, ignoring the app's i18n system. English/Ukrainian patients receive Vietnamese emails.                                                                                                                             | 🔴 High     | Email                | 4h     |
| **3**  | **No phone format validation** — `patient_phone` accepts any string. Invalid phone numbers enter the database silently.                                                                                                                                                                         | 🔴 High     | Patient Form         | 1h     |
| **4**  | **No single-doctor shortcut** — clinics with one doctor still require clicking a doctor card. Unnecessary step adds friction.                                                                                                                                                                   | 🟠 Medium   | Doctor Selection     | 1h     |
| **5**  | **Generic error fallback hides backend validation** — specific validation errors from the backend are replaced with "An error occurred".                                                                                                                                                        | 🟠 Medium   | Error Handling       | 1h     |
| **6**  | **No copy-to-clipboard for booking reference** — patients must manually select and copy their booking number.                                                                                                                                                                                   | 🟠 Medium   | Success Page         | 0.5h   |
| **7**  | **Step indicator may overflow on 320px** — 5 steps at 64px each = 320px minimum, leaving zero margin on small phones.                                                                                                                                                                           | 🟠 Medium   | Mobile UX            | 1h     |
| **8**  | **Indirect form submission** — `document.querySelector("form").requestSubmit()` is fragile and breaks if form structure changes.                                                                                                                                                                | 🟡 Low      | Patient Form         | 0.5h   |
| **9**  | **No clinic address on success page or email** — patients don't know where to go for their appointment.                                                                                                                                                                                         | 🟡 Low      | Success Page / Email | 1h     |
| **10** | **No "Add to Calendar"** — no .ics download or calendar link on success page or email.                                                                                                                                                                                                          | 🟡 Low      | Success Page / Email | 3h     |

---

## Quick Wins (< 2 hours)

| #   | Item                                                                                                                                                        | Effort | Impact |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 1   | **Add copy-to-clipboard button** for booking reference on success page. Use existing [`useCopyToClipboard`](frontend/src/hooks/useCopyToClipboard.ts) hook. | 0.5h   | Medium |
| 2   | **Fix indirect form submission** — move submit button inside `<form>` or use `form` HTML attribute.                                                         | 0.5h   | Low    |
| 3   | **Add phone regex validation** — basic pattern for international phone numbers (e.g., `^\+?[1-9]\d{6,14}$`).                                                | 1h     | High   |
| 4   | **Single-doctor auto-select** — if only 1 doctor exists, skip Step 1.                                                                                       | 1h     | Medium |
| 5   | **Fix generic error fallback** — improve error message extraction to show backend validation details.                                                       | 1h     | Medium |
| 6   | **Add loading skeleton for doctor list** — replace "Loading..." text with skeleton cards.                                                                   | 0.5h   | Low    |
| 7   | **Fix step indicator overflow on 320px** — reduce circle size or connector width on small screens.                                                          | 1h     | Medium |

## Medium Improvements (2–8 hours)

| #   | Item                                                                                                                             | Effort | Impact      |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| 1   | **Fix confirmation page auth requirement** — create a public endpoint or pass appointment data without requiring authentication. | 2h     | 🔴 Critical |
| 2   | **Localize email templates** — use i18n or pass locale to email generation, render templates in patient's language.              | 4h     | High        |
| 3   | **Add clinic address to success page and emails** — store clinic address in settings and display it.                             | 2h     | Medium      |
| 4   | **Add "Add to Calendar" (.ics)** — generate .ics file on success page and attach to email.                                       | 3h     | Medium      |
| 5   | **Add contact method dependency to form** — require email when "Email" contact method is selected.                               | 1h     | Medium      |
| 6   | **Add retry mechanism for failed bookings** — if API fails, show retry button instead of requiring re-entry.                     | 2h     | Medium      |
| 7   | **Add patient notes to doctor email** — include `notes` field in doctor notification template.                                   | 0.5h   | Low         |

## Not Worth Doing

| #   | Idea                                          | Reason                                                                                             |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | **Swipe gestures between steps**              | Adds complexity with marginal benefit. The step indicator + back/next buttons are sufficient.      |
| 2   | **Doctor search/filter**                      | Unnecessary for MVP — most clinics have 1-5 doctors. Can be added later if needed.                 |
| 3   | **SMS confirmation**                          | Requires SMS gateway integration, cost, and regulatory compliance. Email is sufficient for MVP.    |
| 4   | **Social login for booking**                  | Booking is intentionally anonymous — requiring login would reduce conversion.                      |
| 5   | **Real-time slot availability via WebSocket** | Over-engineered for current scale. The 409 conflict handling is sufficient.                        |
| 6   | **Multi-language email templates**            | Instead, pass locale to the template renderer and use conditional blocks within a single template. |
| 7   | **Captcha on booking form**                   | Adds friction. Rate limiting at the API level is more appropriate.                                 |

---

## Sprint 6.6 Implementation Plan

Ordered by **Business Value First** (impact × urgency ÷ effort).

### Phase 1: Critical Fixes (Day 1)

| Priority | Item                                                                              | Effort | Reason                                                      |
| -------- | --------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| P0       | **Fix confirmation page auth** — create public endpoint or pass data without auth | 2h     | Currently broken for all unauthenticated patients           |
| P1       | **Add phone validation** — prevent invalid phone numbers                          | 1h     | Data quality + patient reachability                         |
| P1       | **Fix generic error fallback** — show real validation errors                      | 1h     | Patients see "An error occurred" instead of useful messages |

### Phase 2: High-Value UX (Day 2)

| Priority | Item                                                           | Effort | Reason                          |
| -------- | -------------------------------------------------------------- | ------ | ------------------------------- |
| P2       | **Single-doctor auto-select** — skip Step 1 when only 1 doctor | 1h     | Reduces clicks for most clinics |
| P2       | **Copy-to-clipboard for booking reference**                    | 0.5h   | High visibility, low effort     |
| P2       | **Fix step indicator on 320px**                                | 1h     | Ensures mobile usability        |
| P2       | **Fix indirect form submission**                               | 0.5h   | Code quality + reliability      |

### Phase 3: Email & Content (Day 3)

| Priority | Item                                                  | Effort | Reason                               |
| -------- | ----------------------------------------------------- | ------ | ------------------------------------ |
| P3       | **Localize email templates** — use patient's language | 4h     | Critical for non-Vietnamese patients |
| P3       | **Add clinic address to success page + email**        | 2h     | Patients need to know where to go    |
| P3       | **Add patient notes to doctor email**                 | 0.5h   | Useful for doctor preparation        |

### Phase 4: Enhancement (Day 4)

| Priority | Item                                        | Effort | Reason                                |
| -------- | ------------------------------------------- | ------ | ------------------------------------- |
| P4       | **Add "Add to Calendar" (.ics)**            | 3h     | Reduces no-shows                      |
| P4       | **Add retry mechanism for failed bookings** | 2h     | Improves conversion on network issues |
| P4       | **Contact method dependency in form**       | 1h     | Ensures valid contact info            |

### Total Estimated Effort: **19.5 hours** (~3 days for a single developer)

---

## Key Files Referenced

| File                                                                                                                             | Purpose                                        |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [`frontend/src/components/Booking/BookingWizard.tsx`](frontend/src/components/Booking/BookingWizard.tsx)                         | Main booking wizard with step management       |
| [`frontend/src/components/Booking/BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx)                             | Booking page container                         |
| [`frontend/src/components/Booking/BookingConfirmation.tsx`](frontend/src/components/Booking/BookingConfirmation.tsx)             | Success/confirmation display                   |
| [`frontend/src/components/Booking/PatientInfoForm.tsx`](frontend/src/components/Booking/PatientInfoForm.tsx)                     | Patient information form with zod validation   |
| [`frontend/src/components/Booking/DoctorCard.tsx`](frontend/src/components/Booking/DoctorCard.tsx)                               | Doctor selection card                          |
| [`frontend/src/components/Booking/DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx)                               | Date selection component                       |
| [`frontend/src/components/Booking/TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx)                           | Time slot grid with empty states               |
| [`frontend/src/components/Booking/StepIndicator.tsx`](frontend/src/components/Booking/StepIndicator.tsx)                         | Step progress indicator                        |
| [`frontend/src/routes/booking/confirmation.tsx`](frontend/src/routes/booking/confirmation.tsx)                                   | Confirmation route (requires auth — **BUG**)   |
| [`backend/app/api/routes/appointments.py`](backend/app/api/routes/appointments.py)                                               | Appointment API endpoints                      |
| [`backend/app/crud.py`](backend/app/crud.py)                                                                                     | Appointment CRUD with validation               |
| [`backend/app/utils.py`](backend/app/utils.py)                                                                                   | Email generation functions                     |
| [`backend/app/email-templates/build/booking_confirmation.html`](backend/app/email-templates/build/booking_confirmation.html)     | Patient email template (Vietnamese only)       |
| [`backend/app/email-templates/build/doctor_new_appointment.html`](backend/app/email-templates/build/doctor_new_appointment.html) | Doctor notification template (Vietnamese only) |
| [`frontend/src/i18n/locales/en/booking.json`](frontend/src/i18n/locales/en/booking.json)                                         | English booking translations                   |
