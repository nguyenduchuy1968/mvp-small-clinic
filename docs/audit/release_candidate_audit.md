# Release Candidate Audit — Sprint 6.7.2

**Date:** 2026-06-24  
**Auditor:** Roo (Architect)  
**Scope:** Complete end-to-end audit of MVP Small Clinic system  
**Mode:** Audit only — no new features implemented

---

## Table of Contents

1. [Patient Flow Audit](#1-patient-flow-audit)
2. [Doctor Flow Audit](#2-doctor-flow-audit)
3. [Admin Flow Audit](#3-admin-flow-audit)
4. [Localization Audit](#4-localization-audit)
5. [Mobile Audit](#5-mobile-audit)
6. [Technical Audit](#6-technical-audit)
7. [Release Readiness](#7-release-readiness)

---

## 1. Patient Flow Audit

### 1.1 Booking Wizard (Steps 1–4)

| #     | Issue                                                           | Severity  | File                                                                                                     | Description                                                                                                                                                                                                                                                                                                                                                       |
| ----- | --------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | **DatePicker uses browser timezone instead of clinic timezone** | 🔴 High   | [`DatePicker.tsx:27`](../../frontend/src/components/Booking/DatePicker.tsx#L27)                          | `const today = new Date()` uses the browser's local timezone. If a patient in UTC-5 accesses the booking page at 8:00 PM local time (which is 8:00 AM UTC+7 next day), the "Today" button shows the wrong date. Should use `getClinicTodayString()` from `utils/date.ts`.                                                                                         |
| P1-02 | **Email validation error not translated**                       | 🟡 Medium | [`PatientInfoForm.tsx:63`](../../frontend/src/components/Booking/PatientInfoForm.tsx#L63)                | `z.string().email()` uses Zod's built-in English error message "Invalid email". The `.optional().or(z.literal(''))` pattern means empty string passes validation, but an invalid email shows an English error regardless of locale. Should use `.email({ message: t('form.emailInvalid') })` — but the key `form.emailInvalid` does not exist in any locale file. |
| P1-03 | **Booking page title hardcoded in English**                     | 🟡 Medium | [`booking.tsx:10`](../../frontend/src/routes/booking.tsx#L10)                                            | Route head meta `title: 'Book Appointment'` is hardcoded. Should use `t('booking:title')` for i18n support.                                                                                                                                                                                                                                                       |
| P1-04 | **Confirmation page forces full page reload**                   | 🟡 Medium | [`BookingConfirmation.tsx:57`](../../frontend/src/components/Booking/BookingConfirmation.tsx#L57)        | `window.location.href = '/booking'` causes a full page flash/refresh. Comment says `navigate()` to same route is a no-op, but this is a suboptimal UX. Consider using React Router's `navigate({ to: '/booking', replace: true })` with a state reset mechanism.                                                                                                  |
| P1-05 | **No loading/skeleton state on confirmation page**              | 🟢 Low    | [`BookingPage.tsx:31-33`](../../frontend/src/components/Booking/BookingPage.tsx#L31-L33)                 | The confirmation page renders immediately with data from the mutation success callback. There's no loading spinner or skeleton while the mutation is in flight. The `isPending` state from `useCreateAppointment` is not used to show a loading state.                                                                                                            |
| P1-06 | **No email sending verification**                               | 🟢 Low    | [`BookingConfirmation.tsx:42-44`](../../frontend/src/components/Booking/BookingConfirmation.tsx#L42-L44) | The confirmation page says "A confirmation email has been sent" but there is no way to verify this from the frontend code alone. This depends on backend email configuration.                                                                                                                                                                                     |
| P1-07 | **StepIndicator labels hidden on mobile**                       | 🟢 Low    | [`StepIndicator.tsx`](../../frontend/src/components/Booking/StepIndicator.tsx)                           | Step labels use `hidden sm:block` — on mobile (<640px), only step numbers/checkmarks are visible without text labels. This is acceptable for MVP but could be confusing.                                                                                                                                                                                          |
| P1-08 | **Contact method options include Vietnam-specific channels**    | 🟢 Low    | [`PatientInfoForm.tsx:25-32`](../../frontend/src/components/Booking/PatientInfoForm.tsx#L25-L32)         | `CONTACT_METHODS` includes `zalo` and `viber` which are Vietnam-specific. This is correct for the target market but worth noting for internationalization.                                                                                                                                                                                                        |

### 1.2 Booking Confirmation

| #     | Issue                                          | Severity | File                                                                                                     | Description                                                      |
| ----- | ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| P1-09 | **Copy button uses `useCopyToClipboard` hook** | ✅ OK    | [`BookingConfirmation.tsx:43-51`](../../frontend/src/components/Booking/BookingConfirmation.tsx#L43-L51) | Works correctly. Toast feedback in both success and error cases. |
| P1-10 | **Booking number displayed correctly**         | ✅ OK    | [`BookingConfirmation.tsx`](../../frontend/src/components/Booking/BookingConfirmation.tsx)               | Uses `booking_number` field which matches the API schema.        |

### 1.3 Patient Flow Score

| Category             | Score      | Notes                            |
| -------------------- | ---------- | -------------------------------- |
| Booking Wizard UX    | 7/10       | Timezone bug is the main concern |
| Confirmation UX      | 8/10       | Full page reload is suboptimal   |
| Form Validation      | 7/10       | Email validation not translated  |
| Overall Patient Flow | **7.3/10** |                                  |

---

## 2. Doctor Flow Audit

### 2.1 Dashboard

| #      | Issue                                    | Severity  | File                                                                             | Description                                                                                                                                                                                                                        |
| ------ | ---------------------------------------- | --------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01-01 | **Duplicate welcome text**               | 🟡 Medium | [`_layout/index.tsx:24-29`](../../frontend/src/routes/_layout/index.tsx#L24-L29) | Shows `{t('welcome')}, {currentUser?.full_name} 👋` AND `{t('welcome')}, {t('welcomeBack')}` — the word "Welcome" appears twice. The second `<p>` should likely only show `{t('welcomeBack')}` without repeating `{t('welcome')}`. |
| D01-02 | **Dashboard page title hardcoded**       | 🟡 Medium | [`_layout/index.tsx:11`](../../frontend/src/routes/_layout/index.tsx#L11)        | `title: 'Dashboard'` is hardcoded. Should use `t('dashboard:title')`.                                                                                                                                                              |
| D01-03 | **No stats/overview cards on dashboard** | 🟢 Low    | [`_layout/index.tsx:17-33`](../../frontend/src/routes/_layout/index.tsx#L17-L33) | Dashboard only shows welcome message. No appointment count, upcoming appointments, or quick stats. This is a feature gap, not a bug.                                                                                               |

### 2.2 Appointments

| #      | Issue                              | Severity | File                                                                                          | Description                                                                                                                                  |
| ------ | ---------------------------------- | -------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| D02-01 | **Search is client-side only**     | 🟢 Low   | [`AppointmentList.tsx`](../../frontend/src/components/Appointments/AppointmentList.tsx)       | Search filters by `booking_number`, `patient_name`, `patient_phone` in-memory. Acceptable for MVP but won't scale beyond ~1000 appointments. |
| D02-02 | **Appointment status update flow** | ✅ OK    | [`useUpdateAppointmentStatus.ts`](../../frontend/src/hooks/useUpdateAppointmentStatus.ts)     | Uses React Query mutation with proper invalidation.                                                                                          |
| D02-03 | **Appointment details view**       | ✅ OK    | [`AppointmentDetails.tsx`](../../frontend/src/components/Appointments/AppointmentDetails.tsx) | Shows all relevant appointment information.                                                                                                  |

### 2.3 Availability Management

| #      | Issue                                 | Severity  | File                                                                                      | Description                                                             |
| ------ | ------------------------------------- | --------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| D03-01 | **Availability page title hardcoded** | 🟡 Medium | [`availability.tsx:130`](../../frontend/src/routes/_layout/availability.tsx#L130)         | `title: 'Schedule'` is hardcoded. Should use `t('availability:title')`. |
| D03-02 | **Availability form validation**      | ✅ OK     | [`AvailabilityForm.tsx`](../../frontend/src/components/Availability/AvailabilityForm.tsx) | Properly validates weekday, start/end time, duration.                   |
| D03-03 | **Weekly schedule view**              | ✅ OK     | [`WeeklySchedule.tsx`](../../frontend/src/components/Availability/WeeklySchedule.tsx)     | Shows weekly overview correctly.                                        |

### 2.4 Blocked Dates

| #      | Issue                                                    | Severity  | File                                                                                                            | Description                                                                                                                    |
| ------ | -------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --- | ----------------------------------------------------------------------------- |
| D04-01 | **CreateBlockedDates startDate has no `min` constraint** | 🟡 Medium | [`CreateBlockedDates.tsx:103-108`](../../frontend/src/components/BlockedDates/CreateBlockedDates.tsx#L103-L108) | The `startDate` input has no `min` attribute, allowing users to select past dates. The `endDate` correctly has `min={startDate |     | undefined}`(line 121). Should add`min={getClinicTodayString()}` to startDate. |
| D04-02 | **Blocked Dates page title hardcoded**                   | 🟡 Medium | [`blocked-dates.tsx:131`](../../frontend/src/routes/_layout/blocked-dates.tsx#L131)                             | `title: 'Blocked Dates'` is hardcoded. Should use `t('blockedDates:title')`.                                                   |
| D04-03 | **Vietnamese terminology updated**                       | ✅ OK     | [`vi/blockedDates.json`](../../frontend/src/i18n/locales/vi/blockedDates.json)                                  | Uses "Ngày nghỉ" as requested in Sprint 6.7.                                                                                   |

### 2.5 Settings / Profile

| #      | Issue                        | Severity | File                                                                                    | Description                              |
| ------ | ---------------------------- | -------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| D05-01 | **User information display** | ✅ OK    | [`UserInformation.tsx`](../../frontend/src/components/UserSettings/UserInformation.tsx) | Shows user details correctly.            |
| D05-02 | **Change password flow**     | ✅ OK    | [`ChangePassword.tsx`](../../frontend/src/components/UserSettings/ChangePassword.tsx)   | Proper validation and error handling.    |
| D05-03 | **Delete account flow**      | ✅ OK    | [`DeleteAccount.tsx`](../../frontend/src/components/UserSettings/DeleteAccount.tsx)     | Confirmation dialog with proper warning. |

### 2.6 Doctor Flow Score

| Category            | Score      | Notes                                 |
| ------------------- | ---------- | ------------------------------------- |
| Dashboard           | 6/10       | Duplicate welcome text, no stats      |
| Appointments        | 8/10       | Client-side search acceptable for MVP |
| Availability        | 8/10       | Solid implementation                  |
| Blocked Dates       | 7/10       | Missing min constraint on startDate   |
| Settings            | 9/10       | Well-implemented                      |
| Overall Doctor Flow | **7.6/10** |                                       |

---

## 3. Admin Flow Audit

### 3.1 Doctors CRUD

| #      | Issue                             | Severity | File                                                                           | Description                                           |
| ------ | --------------------------------- | -------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| A01-01 | **Doctor form validation**        | ✅ OK    | [`DoctorForm.tsx`](../../frontend/src/components/Doctors/DoctorForm.tsx)       | Proper Zod validation with translated error messages. |
| A01-02 | **Delete with conflict handling** | ✅ OK    | [`DeleteDoctor.tsx`](../../frontend/src/components/Doctors/DeleteDoctor.tsx)   | Handles 409 conflict with force delete option.        |
| A01-03 | **Doctor details view**           | ✅ OK    | [`DoctorDetails.tsx`](../../frontend/src/components/Doctors/DoctorDetails.tsx) | Shows contact and professional info clearly.          |
| A01-04 | **Doctor list with DataTable**    | ✅ OK    | [`DoctorList.tsx`](../../frontend/src/components/Doctors/DoctorList.tsx)       | Pagination, sorting, actions menu all work.           |

### 3.2 Admin-Specific Features

| #      | Issue                                                            | Severity | File                                                                                                                                                 | Description                                                               |
| ------ | ---------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A02-01 | **Doctor selector for admin on Availability/BlockedDates pages** | ✅ OK    | [`availability.tsx`](../../frontend/src/routes/_layout/availability.tsx), [`blocked-dates.tsx`](../../frontend/src/routes/_layout/blocked-dates.tsx) | Admin sees a doctor selector dropdown; doctors auto-resolve their own ID. |
| A02-02 | **Superuser-only Create Doctor button**                          | ✅ OK    | [`DoctorList.tsx`](../../frontend/src/components/Doctors/DoctorList.tsx)                                                                             | Create button only visible to superusers.                                 |
| A02-03 | **Admin page**                                                   | ✅ OK    | [`admin.tsx`](../../frontend/src/routes/_layout/admin.tsx)                                                                                           | Admin management page available.                                          |

### 3.3 Admin Flow Score

| Category           | Score      | Notes                                   |
| ------------------ | ---------- | --------------------------------------- |
| Doctors CRUD       | 9/10       | Well-implemented with conflict handling |
| Admin Permissions  | 9/10       | Proper role-based access                |
| Overall Admin Flow | **9.0/10** |                                         |

---

## 4. Localization Audit

### 4.1 Missing Keys

| #      | Issue                                                 | Severity  | File                                                                                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ----------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L01-01 | **UK common.json missing `appearance` section**       | 🔴 High   | [`uk/common.json`](../../frontend/src/i18n/locales/uk/common.json)                   | The `appearance` section (with keys `title`, `light`, `dark`, `system`, `toggle`) exists in [`en/common.json:13-18`](../../frontend/src/i18n/locales/en/common.json#L13-L18) and [`vi/common.json:13-18`](../../frontend/src/i18n/locales/vi/common.json#L13-L18) but is completely absent from `uk/common.json`. The [`SidebarAppearance`](../../frontend/src/components/Common/Appearance.tsx#L27) component uses `t('common:appearance.title')` etc. — this will fall back to English for Ukrainian users. |
| L01-02 | **UK common.json missing `users.phone` key**          | 🟡 Medium | [`uk/common.json:99-121`](../../frontend/src/i18n/locales/uk/common.json#L99-L121)   | The `users.phone` key exists in [`en/common.json:109`](../../frontend/src/i18n/locales/en/common.json#L109) ("Phone Number") and [`vi/common.json:109`](../../frontend/src/i18n/locales/vi/common.json#L109) ("Số điện thoại") but is missing from `uk/common.json`. Any component using `t('common:users.phone')` will fall back to English.                                                                                                                                                                 |
| L01-03 | **UK common.json has extra `footer` section**         | 🟢 Low    | [`uk/common.json:142-144`](../../frontend/src/i18n/locales/uk/common.json#L142-L144) | UK has a `footer.copyright` key that does not exist in `en/common.json` or `vi/common.json`. This is a minor inconsistency — either add it to all locales or remove from UK.                                                                                                                                                                                                                                                                                                                                  |
| L01-04 | **Route page titles hardcoded in English (4 routes)** | 🟡 Medium | Multiple files                                                                       | [`booking.tsx:10`](../../frontend/src/routes/booking.tsx#L10) ("Book Appointment"), [`_layout/index.tsx:11`](../../frontend/src/routes/_layout/index.tsx#L11) ("Dashboard"), [`blocked-dates.tsx:131`](../../frontend/src/routes/_layout/blocked-dates.tsx#L131) ("Blocked Dates"), [`availability.tsx:130`](../../frontend/src/routes/_layout/availability.tsx#L130) ("Schedule") — all hardcoded in English. Should use `t()` from respective namespaces.                                                   |

### 4.2 Translation Completeness

| Namespace           | EN          | VI          | UK                                     | Notes                             |
| ------------------- | ----------- | ----------- | -------------------------------------- | --------------------------------- |
| `common.json`       | ✅ Complete | ✅ Complete | ⚠️ Missing `appearance`, `users.phone` | See L01-01, L01-02                |
| `booking.json`      | ✅ Complete | ✅ Complete | ✅ Complete                            | All keys present across 3 locales |
| `appointments.json` | ✅ Complete | ✅ Complete | ✅ Complete                            | All keys present                  |
| `doctors.json`      | ✅ Complete | ✅ Complete | ✅ Complete                            | All keys present                  |
| `availability.json` | ✅ Complete | ✅ Complete | ✅ Complete                            | All keys present                  |
| `blockedDates.json` | ✅ Complete | ✅ Complete | ✅ Complete                            | All keys present                  |
| `dashboard.json`    | ✅ Complete | ✅ Complete | ✅ Complete                            | All keys present                  |
| `auth.json`         | ✅ Complete | ✅ Complete | ✅ Complete                            | All keys present                  |

### 4.3 Localization Score

| Category             | Score      | Notes                                  |
| -------------------- | ---------- | -------------------------------------- |
| EN Completeness      | 10/10      |                                        |
| VI Completeness      | 10/10      |                                        |
| UK Completeness      | 7/10       | Missing `appearance` and `users.phone` |
| Route Titles         | 6/10       | 4 routes hardcoded in English          |
| Consistency          | 8/10       | UK has extra `footer` section          |
| Overall Localization | **8.2/10** |                                        |

---

## 5. Mobile Audit

### 5.1 Responsive Analysis (375px / 390px / 430px)

| #      | Issue                                               | Severity | File                                                                                              | Description                                                                                              |
| ------ | --------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| M01-01 | **StepIndicator labels hidden on mobile**           | 🟢 Low   | [`StepIndicator.tsx`](../../frontend/src/components/Booking/StepIndicator.tsx)                    | Labels use `hidden sm:block` — at 375px width, only step numbers/checkmarks visible. Acceptable for MVP. |
| M01-02 | **Sidebar uses sheet on mobile**                    | ✅ OK    | [`sidebar.tsx`](../../frontend/src/components/ui/sidebar.tsx)                                     | shadcn sidebar collapses to a sheet on mobile.                                                           |
| M01-03 | **DataTable horizontal scroll**                     | ✅ OK    | [`DataTable.tsx`](../../frontend/src/components/Common/DataTable.tsx)                             | Tables use horizontal scroll on small screens.                                                           |
| M01-04 | **Booking wizard uses full width on mobile**        | ✅ OK    | [`BookingWizard.tsx`](../../frontend/src/components/Booking/BookingWizard.tsx)                    | Responsive layout with `max-w-4xl` container.                                                            |
| M01-05 | **DatePicker quick buttons use `flex-1` on mobile** | ✅ OK    | [`DatePicker.tsx:43`](../../frontend/src/components/Booking/DatePicker.tsx#L43)                   | `flex-1 sm:flex-none` — buttons stretch full width on mobile, auto-width on desktop.                     |
| M01-06 | **PatientInfoForm uses `sm:grid-cols-2`**           | ✅ OK    | [`PatientInfoForm.tsx:119`](../../frontend/src/components/Booking/PatientInfoForm.tsx#L119)       | Single column on mobile, two columns on desktop.                                                         |
| M01-07 | **Confirmation card max-width**                     | ✅ OK    | [`BookingConfirmation.tsx:61`](../../frontend/src/components/Booking/BookingConfirmation.tsx#L61) | `mx-auto max-w-lg` — centered card with max width.                                                       |
| M01-08 | **DoctorCard text truncation**                      | ✅ OK    | [`DoctorCard.tsx`](../../frontend/src/components/Booking/DoctorCard.tsx)                          | Bio uses `line-clamp-2` for truncation.                                                                  |
| M01-09 | **Dashboard title truncation**                      | ✅ OK    | [`_layout/index.tsx:24`](../../frontend/src/routes/_layout/index.tsx#L24)                         | `truncate max-w-sm` — long names are truncated.                                                          |

### 5.2 Mobile Score

| Category       | Score      | Notes                        |
| -------------- | ---------- | ---------------------------- |
| Booking Flow   | 8/10       | Step labels hidden on mobile |
| Data Display   | 9/10       | Tables scroll horizontally   |
| Navigation     | 9/10       | Sidebar collapses to sheet   |
| Overall Mobile | **8.7/10** |                              |

---

## 6. Technical Audit

### 6.1 Build Verification

| Check              | Status          | Notes                                           |
| ------------------ | --------------- | ----------------------------------------------- |
| TypeScript (`tsc`) | ✅ Passed       | Last build: Sprint 6.7.1 completed successfully |
| Vite Build         | ✅ Passed       | Last build: Sprint 6.7.1 completed successfully |
| Backend (`pytest`) | ⏳ Not verified | Requires running backend with test database     |

### 6.2 Code Quality

| #      | Issue                                               | Severity  | File                                                                                              | Description                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T01-01 | **`DoctorCard` uses `defaultValue` in `t()` call**  | 🟢 Low    | [`DoctorCard.tsx:39`](../../frontend/src/components/Booking/DoctorCard.tsx#L39)                   | `t('doctors:fields.experience', { defaultValue: 'Experience' })` — the `defaultValue` parameter is not a standard i18next option. It may work as a fallback but is not guaranteed. Should use proper i18next fallback or ensure the key exists. |
| T01-02 | **DataTable pagination hidden when pageCount <= 1** | 🟢 Low    | [`DataTable.tsx:122`](../../frontend/src/components/Common/DataTable.tsx#L122)                    | Pagination bar only renders when `table.getPageCount() > 1`. This means single-page data has no "Showing X to Y of Z" text. This is by design but could confuse users.                                                                          |
| T01-03 | **`handleNewBooking` uses `window.location.href`**  | 🟡 Medium | [`BookingConfirmation.tsx:57`](../../frontend/src/components/Booking/BookingConfirmation.tsx#L57) | Forces full page reload instead of React Router navigation. Comment explains why, but it's still suboptimal.                                                                                                                                    |

### 6.3 Dependencies

| Dependency             | Version | Notes                                       |
| ---------------------- | ------- | ------------------------------------------- |
| React                  | 18.x    | Stable                                      |
| TypeScript             | 5.x     | Stable                                      |
| Vite                   | 5.x     | Stable                                      |
| i18next                | 26.3.1  | Stable, interpolation uses `{{var}}` syntax |
| @tanstack/react-table  | 8.x     | Stable                                      |
| @tanstack/react-router | 1.x     | Stable                                      |
| @tanstack/react-query  | 5.x     | Stable                                      |
| Zod                    | 3.x     | Stable                                      |
| shadcn/ui              | Latest  | Stable                                      |

### 6.4 Technical Score

| Category          | Score      | Notes                       |
| ----------------- | ---------- | --------------------------- |
| TypeScript        | 9/10       | Clean types, no `any` abuse |
| Build             | 10/10      | Both tsc and vite pass      |
| Code Quality      | 8/10       | Minor issues noted          |
| Overall Technical | **9.0/10** |                             |

---

## 7. Release Readiness

### 7.1 Severity-Ranked Issue List

#### 🔴 High (Must Fix Before Demo)

| #   | Issue                                       | Area         | File                                                                            | Impact                                                                                    |
| --- | ------------------------------------------- | ------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| H1  | UK common.json missing `appearance` section | Localization | [`uk/common.json`](../../frontend/src/i18n/locales/uk/common.json)              | Ukrainian users see English theme toggle labels. Easy fix — add the 5 missing keys.       |
| H2  | DatePicker uses browser timezone            | Patient Flow | [`DatePicker.tsx:27`](../../frontend/src/components/Booking/DatePicker.tsx#L27) | Patients in different timezones see wrong "Today" date. Could cause booking on wrong day. |

#### 🟡 Medium (Should Fix Before Demo)

| #   | Issue                                    | Area         | File                                                                                                            | Impact                                                     |
| --- | ---------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| M1  | Dashboard duplicate welcome text         | Doctor Flow  | [`_layout/index.tsx:24-29`](../../frontend/src/routes/_layout/index.tsx#L24-L29)                                | "Welcome, Welcome back!" looks unprofessional.             |
| M2  | CreateBlockedDates no `min` on startDate | Doctor Flow  | [`CreateBlockedDates.tsx:103-108`](../../frontend/src/components/BlockedDates/CreateBlockedDates.tsx#L103-L108) | Users can block past dates (no-op but confusing).          |
| M3  | Route page titles hardcoded (4 routes)   | Localization | Multiple route files                                                                                            | Browser tab titles always in English regardless of locale. |
| M4  | UK common.json missing `users.phone`     | Localization | [`uk/common.json`](../../frontend/src/i18n/locales/uk/common.json)                                              | Falls back to English for phone field label.               |
| M5  | Email validation error not translated    | Patient Flow | [`PatientInfoForm.tsx:63`](../../frontend/src/components/Booking/PatientInfoForm.tsx#L63)                       | Zod's built-in "Invalid email" shown in English.           |
| M6  | Confirmation page full page reload       | Patient Flow | [`BookingConfirmation.tsx:57`](../../frontend/src/components/Booking/BookingConfirmation.tsx#L57)               | Suboptimal UX with page flash.                             |

#### 🟢 Low (Nice to Have)

| #   | Issue                                         | Area         | File                                                                                     | Impact                                    |
| --- | --------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| L1  | UK common.json extra `footer` section         | Localization | [`uk/common.json:142-144`](../../frontend/src/i18n/locales/uk/common.json#L142-L144)     | Minor inconsistency.                      |
| L2  | No loading state on confirmation page         | Patient Flow | [`BookingPage.tsx:31-33`](../../frontend/src/components/Booking/BookingPage.tsx#L31-L33) | No visual feedback during mutation.       |
| L3  | `DoctorCard` uses non-standard `defaultValue` | Technical    | [`DoctorCard.tsx:39`](../../frontend/src/components/Booking/DoctorCard.tsx#L39)          | Minor i18n usage concern.                 |
| L4  | DataTable pagination hidden for single page   | Technical    | [`DataTable.tsx:122`](../../frontend/src/components/Common/DataTable.tsx#L122)           | No "Showing X of Y" for single-page data. |
| L5  | Dashboard has no stats/overview               | Doctor Flow  | [`_layout/index.tsx`](../../frontend/src/routes/_layout/index.tsx)                       | Feature gap, not a bug.                   |
| L6  | StepIndicator labels hidden on mobile         | Mobile       | [`StepIndicator.tsx`](../../frontend/src/components/Booking/StepIndicator.tsx)           | Acceptable for MVP.                       |

### 7.2 Final Scores

| Category           | Score      | Weight   |
| ------------------ | ---------- | -------- |
| Patient Flow       | 7.3/10     | 25%      |
| Doctor Flow        | 7.6/10     | 25%      |
| Admin Flow         | 9.0/10     | 15%      |
| Localization       | 8.2/10     | 15%      |
| Mobile UX          | 8.7/10     | 10%      |
| Technical          | 9.0/10     | 10%      |
| **Weighted Total** | **8.0/10** | **100%** |

### 7.3 Final Verdict

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ⚠️  CONDITIONALLY READY FOR FIRST CLINIC DEMO          ║
║                                                          ║
║   Score: 8.0/10                                          ║
║                                                          ║
║   Must fix before demo:                                  ║
║     H1 — UK common.json missing `appearance` section     ║
║     H2 — DatePicker browser timezone bug                 ║
║                                                          ║
║   Should fix before demo:                                ║
║     M1 — Dashboard duplicate welcome text                ║
║     M2 — CreateBlockedDates missing min constraint       ║
║     M3 — 4 route titles hardcoded in English             ║
║     M4 — UK common.json missing `users.phone`            ║
║     M5 — Email validation error not translated           ║
║     M6 — Confirmation page full page reload              ║
║                                                          ║
║   Estimated fix effort: 2–3 hours                        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### 7.4 Recommended Fix Order

1. **H2** — DatePicker timezone bug (30 min) — Replace `new Date()` with `getClinicTodayString()`
2. **H1** — UK appearance section (15 min) — Add 5 missing keys to `uk/common.json`
3. **M1** — Dashboard duplicate welcome (5 min) — Remove duplicate `{t('welcome')}` from second line
4. **M2** — CreateBlockedDates min constraint (5 min) — Add `min={getClinicTodayString()}` to startDate
5. **M3** — Route titles (30 min) — Use `t()` for 4 route page titles
6. **M4** — UK users.phone (5 min) — Add `"phone": "Номер телефону"` to `uk/common.json`
7. **M5** — Email validation (15 min) — Add `form.emailInvalid` key to all 3 booking.json locales and use `.email({ message: t('form.emailInvalid') })`
8. **M6** — Confirmation page reload (30 min) — Replace `window.location.href` with React Router navigation + state reset

---

## Appendix: Files Reviewed

### Frontend Components

- [`BookingPage.tsx`](../../frontend/src/components/Booking/BookingPage.tsx)
- [`BookingWizard.tsx`](../../frontend/src/components/Booking/BookingWizard.tsx)
- [`BookingConfirmation.tsx`](../../frontend/src/components/Booking/BookingConfirmation.tsx)
- [`PatientInfoForm.tsx`](../../frontend/src/components/Booking/PatientInfoForm.tsx)
- [`DatePicker.tsx`](../../frontend/src/components/Booking/DatePicker.tsx)
- [`DoctorCard.tsx`](../../frontend/src/components/Booking/DoctorCard.tsx)
- [`StepIndicator.tsx`](../../frontend/src/components/Booking/StepIndicator.tsx)
- [`TimeSlotGrid.tsx`](../../frontend/src/components/Booking/TimeSlotGrid.tsx)
- [`AppointmentList.tsx`](../../frontend/src/components/Appointments/AppointmentList.tsx)
- [`AppointmentDetails.tsx`](../../frontend/src/components/Appointments/AppointmentDetails.tsx)
- [`DoctorList.tsx`](../../frontend/src/components/Doctors/DoctorList.tsx)
- [`DoctorForm.tsx`](../../frontend/src/components/Doctors/DoctorForm.tsx)
- [`DoctorDetails.tsx`](../../frontend/src/components/Doctors/DoctorDetails.tsx)
- [`CreateDoctor.tsx`](../../frontend/src/components/Doctors/CreateDoctor.tsx)
- [`EditDoctor.tsx`](../../frontend/src/components/Doctors/EditDoctor.tsx)
- [`DeleteDoctor.tsx`](../../frontend/src/components/Doctors/DeleteDoctor.tsx)
- [`AvailabilityList.tsx`](../../frontend/src/components/Availability/AvailabilityList.tsx)
- [`AvailabilityForm.tsx`](../../frontend/src/components/Availability/AvailabilityForm.tsx)
- [`BlockedDatesList.tsx`](../../frontend/src/components/BlockedDates/BlockedDatesList.tsx)
- [`CreateBlockedDates.tsx`](../../frontend/src/components/BlockedDates/CreateBlockedDates.tsx)
- [`DataTable.tsx`](../../frontend/src/components/Common/DataTable.tsx)
- [`AppSidebar.tsx`](../../frontend/src/components/Sidebar/AppSidebar.tsx)
- [`Appearance.tsx`](../../frontend/src/components/Common/Appearance.tsx)

### Routes

- [`booking.tsx`](../../frontend/src/routes/booking.tsx)
- [`_layout/index.tsx`](../../frontend/src/routes/_layout/index.tsx)
- [`_layout/blocked-dates.tsx`](../../frontend/src/routes/_layout/blocked-dates.tsx)
- [`_layout/availability.tsx`](../../frontend/src/routes/_layout/availability.tsx)

### Locale Files

- [`en/common.json`](../../frontend/src/i18n/locales/en/common.json)
- [`vi/common.json`](../../frontend/src/i18n/locales/vi/common.json)
- [`uk/common.json`](../../frontend/src/i18n/locales/uk/common.json)
- [`en/booking.json`](../../frontend/src/i18n/locales/en/booking.json)
- [`vi/booking.json`](../../frontend/src/i18n/locales/vi/booking.json)
- [`uk/booking.json`](../../frontend/src/i18n/locales/uk/booking.json)
- [`en/appointments.json`](../../frontend/src/i18n/locales/en/appointments.json)
- [`vi/appointments.json`](../../frontend/src/i18n/locales/vi/appointments.json)
- [`uk/appointments.json`](../../frontend/src/i18n/locales/uk/appointments.json)
- [`en/doctors.json`](../../frontend/src/i18n/locales/en/doctors.json)
- [`vi/doctors.json`](../../frontend/src/i18n/locales/vi/doctors.json)
- [`uk/doctors.json`](../../frontend/src/i18n/locales/uk/doctors.json)
- [`en/availability.json`](../../frontend/src/i18n/locales/en/availability.json)
- [`vi/availability.json`](../../frontend/src/i18n/locales/vi/availability.json)
- [`uk/availability.json`](../../frontend/src/i18n/locales/uk/availability.json)
- [`en/blockedDates.json`](../../frontend/src/i18n/locales/en/blockedDates.json)
- [`vi/blockedDates.json`](../../frontend/src/i18n/locales/vi/blockedDates.json)
- [`uk/blockedDates.json`](../../frontend/src/i18n/locales/uk/blockedDates.json)
- [`en/dashboard.json`](../../frontend/src/i18n/locales/en/dashboard.json)
- [`vi/dashboard.json`](../../frontend/src/i18n/locales/vi/dashboard.json)
- [`uk/dashboard.json`](../../frontend/src/i18n/locales/uk/dashboard.json)
- [`en/auth.json`](../../frontend/src/i18n/locales/en/auth.json)
- [`vi/auth.json`](../../frontend/src/i18n/locales/vi/auth.json)
- [`uk/auth.json`](../../frontend/src/i18n/locales/uk/auth.json)

### Utilities & Hooks

- [`date.ts`](../../frontend/src/utils/date.ts)
- [`useAvailableSlots.ts`](../../frontend/src/hooks/useAvailableSlots.ts)
- [`useCreateAppointment.ts`](../../frontend/src/hooks/useCreateAppointment.ts)
- [`i18n/index.ts`](../../frontend/src/i18n/index.ts)
