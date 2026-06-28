# Sprint 7.8 — UI Consistency Audit Report

**Date:** 2026-06-27  
**Auditor:** Automated Codebase Analysis  
**Scope:** Frontend application vs. Design System (docs/frontent/\*.md + theme tokens)
**Status:** Audit Only — No Implementation

> **Note:** This report is a set of **recommendations**, not an implementation task list.
> Every finding must be evaluated against product priorities before implementation.
> See **Appendix C: Classified Action Items** for the Required / Recommended / Optional classification.

---

## Executive Summary

This report audits the entire frontend codebase against the Design System documents and theme token files. The Design System documents (`docs/frontent/*.md`) are largely **template/stub documents** — they describe what _should_ be in each document but lack actual specifications (hex values, component APIs, layout rules). The **actual source of truth** is the theme token files at [`frontend/src/theme/`](frontend/src/theme/) and the CSS custom properties in [`frontend/src/index.css`](frontend/src/index.css).

**Total Inconsistencies Found: 48**  
**Critical: 12 | Medium: 22 | Low: 14**

---

## Phase 1 & 2: Page-by-Page Audit

### 1. Landing Page (`frontend/src/pages/LandingPage.tsx`)

| #   | Issue                                                                        | Location                                                                                                                                                                                                                                                                                                                                                                                   | Priority     | Details                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Hardcoded `bg-white`** — Design System uses `bg-background` / CSS variable | [`LandingHeader.tsx`](frontend/src/components/Landing/LandingHeader.tsx)                                                                                                                                                                                                                                                                                                                   | **Critical** | Header uses `bg-white/95 backdrop-blur-md` instead of theme token. Breaks dark mode.                                                                                                 |
| 2   | **Hardcoded `bg-white`** on sections                                         | [`HeroSection.tsx`](frontend/src/components/Landing/HeroSection.tsx), [`AboutSection.tsx`](frontend/src/components/Landing/AboutSection.tsx), [`ServicesSection.tsx`](frontend/src/components/Landing/ServicesSection.tsx), [`ClinicInfoSection.tsx`](frontend/src/components/Landing/ClinicInfoSection.tsx), [`FinalCTASection.tsx`](frontend/src/components/Landing/FinalCTASection.tsx) | **Critical** | All use `bg-white` or `bg-gray-50` instead of theme tokens. Dark mode will break.                                                                                                    |
| 3   | **Hardcoded `text-gray-600`** for body text                                  | Multiple sections                                                                                                                                                                                                                                                                                                                                                                          | **Medium**   | Should use `text-muted-foreground` or theme token.                                                                                                                                   |
| 4   | **Hardcoded `text-teal-600`** for accent text                                | [`HeroSection.tsx`](frontend/src/components/Landing/HeroSection.tsx)                                                                                                                                                                                                                                                                                                                       | **Medium**   | Should reference `text-primary` or `text-[var(--color-primary)]`.                                                                                                                    |
| 5   | **No `PageHeader` component used**                                           | Landing page                                                                                                                                                                                                                                                                                                                                                                               | **Low**      | Landing page has its own header pattern; this is acceptable since it's a marketing page, but should be noted.                                                                        |
| 6   | **No `Container` component used**                                            | All landing sections                                                                                                                                                                                                                                                                                                                                                                       | **Medium**   | Design System defines `Container` component at [`components/ui/Container.tsx`](frontend/src/components/ui/Container.tsx) but landing sections use `max-w-7xl mx-auto px-4` directly. |
| 7   | **Hardcoded border colors**                                                  | [`ServicesSection.tsx`](frontend/src/components/Landing/ServicesSection.tsx)                                                                                                                                                                                                                                                                                                               | **Medium**   | Uses `border-gray-200` instead of `border-border`.                                                                                                                                   |

### 2. Doctors Directory Page (`frontend/src/pages/DoctorsDirectoryPage.tsx`)

| #   | Issue                                          | Location                                                                    | Priority     | Details                                                           |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| 8   | **Hardcoded `bg-white`** for cards             | [`DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx:1) | **Critical** | Doctor cards use `bg-white` instead of `bg-card` or CSS variable. |
| 9   | **Hardcoded `border-gray-200`**                | [`DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx:1) | **Medium**   | Filter pills and cards use hardcoded border colors.               |
| 10  | **Hardcoded `text-[15px]`** for specialty text | [`DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx:1) | **Medium**   | Should use theme typography token (`text-sm` = 15px from theme).  |
| 11  | **Uses `ui/DoctorCard.tsx`** correctly         | [`DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx:1) | ✅ OK        | Reusable component used.                                          |
| 12  | **Uses `PageHeader`** correctly                | [`DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx:1) | ✅ OK        | PageHeader with title/description.                                |
| 13  | **Uses `EmptyState`** correctly                | [`DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx:1) | ✅ OK        | Empty state for no results.                                       |
| 14  | **Uses `LoadingCard`** correctly               | [`DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx:1) | ✅ OK        | Loading skeleton grid.                                            |

### 3. Booking Page (`frontend/src/components/Booking/BookingPage.tsx`)

| #   | Issue                                                   | Location                                                               | Priority     | Details                                                                                         |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| 15  | **Hardcoded `bg-gradient-to-b from-slate-50 to-white`** | [`BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx:1) | **Critical** | Gradient uses hardcoded colors. Dark mode will not render correctly.                            |
| 16  | **Hardcoded `bg-white`** on clinic info panel           | [`BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx:1) | **Critical** | Clinic identity panel uses `bg-white`.                                                          |
| 17  | **Duplicated clinic info** — mobile vs desktop          | [`BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx:1) | **Medium**   | Clinic info rendered twice (mobile block + desktop sidebar). Should use responsive CSS instead. |
| 18  | **No `PageHeader` component**                           | [`BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx:1) | **Low**      | Booking page has its own header; acceptable for wizard flow.                                    |
| 19  | **Hardcoded `text-gray-500`** for labels                | [`BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx:1) | **Medium**   | Should use `text-muted-foreground`.                                                             |

### 4. Booking Wizard (`frontend/src/components/Booking/BookingWizard.tsx`)

| #   | Issue                                               | Location                                                                   | Priority     | Details                                      |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------- | ------------ | -------------------------------------------- |
| 20  | **Hardcoded `bg-white`** on Card                    | [`BookingWizard.tsx`](frontend/src/components/Booking/BookingWizard.tsx:1) | **Critical** | Card wrapper uses `bg-white`.                |
| 21  | **Hardcoded `text-gray-500`** for step labels       | [`BookingWizard.tsx`](frontend/src/components/Booking/BookingWizard.tsx:1) | **Medium**   | Should use `text-muted-foreground`.          |
| 22  | **Hardcoded `border-gray-200`** for step connectors | [`StepIndicator.tsx`](frontend/src/components/Booking/StepIndicator.tsx:1) | **Medium**   | Connecting lines use hardcoded border color. |

### 5. Booking Components

| #   | Issue                                                             | Location                                                                               | Priority   | Details                                          |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| 23  | **Hardcoded `bg-teal-500` / `text-white`** on selected date       | [`DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx:1)                   | **Medium** | Should use `bg-primary text-primary-foreground`. |
| 24  | **Hardcoded `bg-orange-50 text-orange-600`** for weekend dates    | [`DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx:1)                   | **Medium** | Should use theme semantic tokens.                |
| 25  | **Hardcoded `bg-gray-100 text-gray-400`** for disabled dates      | [`DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx:1)                   | **Medium** | Should use `bg-muted text-muted-foreground`.     |
| 26  | **Hardcoded `bg-teal-50 border-teal-200`** for selected time slot | [`TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx:1)               | **Medium** | Should use theme tokens.                         |
| 27  | **Hardcoded `text-gray-500`** for time hints                      | [`TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx:1)               | **Low**    | Should use `text-muted-foreground`.              |
| 28  | **Hardcoded `bg-green-50 border-green-200`** for success state    | [`BookingConfirmation.tsx`](frontend/src/components/Booking/BookingConfirmation.tsx:1) | **Medium** | Confirmation card uses hardcoded green.          |
| 29  | **Hardcoded `text-green-600`** for success icon/text              | [`BookingConfirmation.tsx`](frontend/src/components/Booking/BookingConfirmation.tsx:1) | **Medium** | Should use `text-success` or theme token.        |

### 6. Authenticated Layout (`frontend/src/routes/_layout.tsx`)

| #   | Issue                                                 | Location                                           | Priority     | Details                                                                                     |
| --- | ----------------------------------------------------- | -------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| 30  | **Hardcoded `bg-slate-50`** for main content area     | [`_layout.tsx`](frontend/src/routes/_layout.tsx:1) | **Critical** | Main content uses `bg-slate-50` instead of `bg-background` or CSS variable.                 |
| 31  | **Hardcoded `p-6 md:p-8`** — should use theme spacing | [`_layout.tsx`](frontend/src/routes/_layout.tsx:1) | **Low**      | Spacing tokens define `p-8` as default card padding; layout padding should reference theme. |
| 32  | **Uses `max-w-7xl`** — matches theme                  | [`_layout.tsx`](frontend/src/routes/_layout.tsx:1) | ✅ OK        | Container width matches `spacing.ts`.                                                       |

### 7. Login Page (`frontend/src/routes/login.tsx`)

| #   | Issue                                         | Location                                       | Priority | Details                             |
| --- | --------------------------------------------- | ---------------------------------------------- | -------- | ----------------------------------- |
| 33  | **Uses `AuthLayout`** correctly               | [`login.tsx`](frontend/src/routes/login.tsx:1) | ✅ OK    | Reusable layout component used.     |
| 34  | **Uses `PasswordInput`** correctly            | [`login.tsx`](frontend/src/routes/login.tsx:1) | ✅ OK    | Reusable input component used.      |
| 35  | **Uses `LoadingButton`** correctly            | [`login.tsx`](frontend/src/routes/login.tsx:1) | ✅ OK    | Loading state handled.              |
| 36  | **Hardcoded `text-gray-500`** for helper text | [`login.tsx`](frontend/src/routes/login.tsx:1) | **Low**  | Should use `text-muted-foreground`. |

### 8. Admin Page (`frontend/src/routes/_layout/admin.tsx`)

| #   | Issue                                       | Location                                               | Priority     | Details                                                   |
| --- | ------------------------------------------- | ------------------------------------------------------ | ------------ | --------------------------------------------------------- |
| 37  | **Uses `DataTable`** correctly              | [`admin.tsx`](frontend/src/routes/_layout/admin.tsx:1) | ✅ OK        | Reusable DataTable component used.                        |
| 38  | **No `PageHeader`** — uses inline title     | [`admin.tsx`](frontend/src/routes/_layout/admin.tsx:1) | **Low**      | Title is inline `<h1>` instead of `PageHeader` component. |
| 39  | **Hardcoded `bg-white`** on table container | [`admin.tsx`](frontend/src/routes/_layout/admin.tsx:1) | **Critical** | Table wrapper uses `bg-white`.                            |

### 9. Appointments Pages

| #   | Issue                                                         | Location                                                                         | Priority   | Details                                                        |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| 40  | **Uses `AppointmentList`** correctly                          | [`appointments.index.tsx`](frontend/src/routes/_layout/appointments.index.tsx:1) | ✅ OK      | Reusable component used.                                       |
| 41  | **Uses `AppointmentDetails`** correctly                       | [`appointments.$id.tsx`](frontend/src/routes/_layout/appointments.$id.tsx:1)     | ✅ OK      | Reusable component used.                                       |
| 42  | **Uses `AppointmentCard`** correctly                          | [`AppointmentCard.tsx`](frontend/src/components/ui/AppointmentCard.tsx:1)        | ✅ OK      | Reusable card component used.                                  |
| 43  | **Hardcoded `bg-green-100 text-green-800`** for status badges | [`AppointmentCard.tsx`](frontend/src/components/ui/AppointmentCard.tsx:1)        | **Medium** | Status colors hardcoded instead of using `badge.tsx` variants. |

### 10. Blocked Dates Page (`frontend/src/routes/_layout/blocked-dates.tsx`)

| #   | Issue                                       | Location                                                               | Priority     | Details                            |
| --- | ------------------------------------------- | ---------------------------------------------------------------------- | ------------ | ---------------------------------- |
| 44  | **Uses `PageHeader`** correctly             | [`blocked-dates.tsx`](frontend/src/routes/_layout/blocked-dates.tsx:1) | ✅ OK        | PageHeader with title/description. |
| 45  | **Hardcoded `bg-white`** on card containers | [`blocked-dates.tsx`](frontend/src/routes/_layout/blocked-dates.tsx:1) | **Critical** | Card wrappers use `bg-white`.      |

### 11. Doctor Management Pages

| #   | Issue                              | Location                                                                                                                                         | Priority | Details                       |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------- |
| 46  | **Uses `DoctorList`** correctly    | [`doctors.tsx`](frontend/src/routes/_layout/doctors.tsx:1)                                                                                       | ✅ OK    | Reusable component used.      |
| 47  | **Uses `DoctorDetails`** correctly | [`doctors.$id.tsx`](frontend/src/routes/_layout/doctors.$id.tsx:1)                                                                               | ✅ OK    | Reusable component used.      |
| 48  | **Uses `DoctorForm`** correctly    | [`doctors.new.tsx`](frontend/src/routes/_layout/doctors.new.tsx:1), [`doctors.$id.edit.tsx`](frontend/src/routes/_layout/doctors.$id.edit.tsx:1) | ✅ OK    | Reusable form component used. |

### 12. Availability Pages

| #   | Issue                                 | Location                                                                                                                                                             | Priority | Details                       |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- |
| 49  | **Uses `AvailabilityList`** correctly | [`availability.tsx`](frontend/src/routes/_layout/availability.tsx:1)                                                                                                 | ✅ OK    | Reusable component used.      |
| 50  | **Uses `AvailabilityForm`** correctly | [`availability.new.tsx`](frontend/src/routes/_layout/availability.new.tsx:1), [`availability.$id.edit.tsx`](frontend/src/routes/_layout/availability.$id.edit.tsx:1) | ✅ OK    | Reusable form component used. |

### 13. Settings Page (`frontend/src/routes/_layout/settings.tsx`)

| #   | Issue                                      | Location                                                     | Priority     | Details                                            |
| --- | ------------------------------------------ | ------------------------------------------------------------ | ------------ | -------------------------------------------------- |
| 51  | **No `PageHeader`** — uses inline title    | [`settings.tsx`](frontend/src/routes/_layout/settings.tsx:1) | **Low**      | Title is inline instead of `PageHeader` component. |
| 52  | **Hardcoded `bg-white`** on settings cards | [`settings.tsx`](frontend/src/routes/_layout/settings.tsx:1) | **Critical** | Settings cards use `bg-white`.                     |

### 14. Dashboard Page (`frontend/src/routes/_layout/dashboard.tsx`)

| #   | Issue                                   | Location                                                                       | Priority     | Details                                            |
| --- | --------------------------------------- | ------------------------------------------------------------------------------ | ------------ | -------------------------------------------------- |
| 53  | **No `PageHeader`** — uses inline title | [`dashboard.tsx`](frontend/src/routes/_layout/dashboard.tsx:1)                 | **Low**      | Title is inline instead of `PageHeader` component. |
| 54  | **Hardcoded `bg-white`** on stat cards  | [`StatisticsCard.tsx`](frontend/src/components/Dashboard/StatisticsCard.tsx:1) | **Critical** | Statistics cards use `bg-white`.                   |

---

## Phase 3: Component Audit

### 3.1 Reusable Component Usage

| Component                                                           | Defined In       | Usage Status  | Notes                                                                                                  |
| ------------------------------------------------------------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| [`PageHeader`](frontend/src/components/ui/PageHeader.tsx)           | `components/ui/` | **Underused** | Only used in DoctorsDirectoryPage, BlockedDates. Not used in Dashboard, Appointments, Admin, Settings. |
| [`EmptyState`](frontend/src/components/ui/EmptyState.tsx)           | `components/ui/` | ✅ Used       | Used in DoctorsDirectoryPage, AppointmentList.                                                         |
| [`LoadingCard`](frontend/src/components/ui/LoadingCard.tsx)         | `components/ui/` | ✅ Used       | Used in DoctorsDirectoryPage.                                                                          |
| [`DoctorCard`](frontend/src/components/ui/DoctorCard.tsx)           | `components/ui/` | ✅ Used       | Used in DoctorsDirectoryPage.                                                                          |
| [`AppointmentCard`](frontend/src/components/ui/AppointmentCard.tsx) | `components/ui/` | ✅ Used       | Used in AppointmentList.                                                                               |
| [`ClinicInfoCard`](frontend/src/components/ui/ClinicInfoCard.tsx)   | `components/ui/` | **Not Used**  | Defined but never imported anywhere.                                                                   |
| [`Container`](frontend/src/components/ui/Container.tsx)             | `components/ui/` | **Not Used**  | Defined but never imported anywhere.                                                                   |
| [`CTASection`](frontend/src/components/ui/CTASection.tsx)           | `components/ui/` | **Not Used**  | Defined but never imported anywhere.                                                                   |
| [`button-group`](frontend/src/components/ui/button-group.tsx)       | `components/ui/` | **Not Used**  | Defined but never imported anywhere.                                                                   |

### 3.2 Duplicate Components

| #   | Issue                                            | Priority     | Details                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 55  | **Duplicate `DoctorCard`** — two implementations | **Critical** | [`components/Booking/DoctorCard.tsx`](frontend/src/components/Booking/DoctorCard.tsx) and [`components/ui/DoctorCard.tsx`](frontend/src/components/ui/DoctorCard.tsx) are separate implementations. Booking version is a selectable card with initials avatar; UI version is a profile card with full details. These should be unified or one should extend the other. |
| 56  | **Duplicate clinic info in BookingPage**         | **Medium**   | Clinic identity is rendered twice (mobile block + desktop sidebar) in [`BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx). Should use responsive CSS with a single instance.                                                                                                                                                                          |

### 3.3 Missing Components (Defined in Design System but Not Implemented)

| Component                                            | Design System Reference   | Status                                                                                                                 |
| ---------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `StatCard`                                           | `03_COMPONENT_LIBRARY.md` | Dashboard uses `StatisticsCard` — similar but not matching the name.                                                   |
| `StatusBadge`                                        | `03_COMPONENT_LIBRARY.md` | `badge.tsx` exists but is not consistently used for statuses.                                                          |
| `Modal`                                              | `03_COMPONENT_LIBRARY.md` | `dialog.tsx` exists (shadcn/ui Dialog).                                                                                |
| `PrimaryButton` / `SecondaryButton` / `DangerButton` | `03_COMPONENT_LIBRARY.md` | `button.tsx` has variants (default/destructive/outline/secondary/ghost/link) — naming doesn't match Design System doc. |

---

## Phase 4: Theme Audit

### 4.1 Hardcoded Colors (Critical Issues)

The most pervasive issue across the codebase is the use of hardcoded Tailwind color classes instead of theme CSS variables. This breaks dark mode support.

| Color Class Used                   | Occurrences            | Should Use                           |
| ---------------------------------- | ---------------------- | ------------------------------------ |
| `bg-white`                         | ~30+ locations         | `bg-background` or `bg-card`         |
| `bg-slate-50`                      | Layout, multiple pages | `bg-background` or `bg-muted`        |
| `bg-gray-50`                       | Landing sections       | `bg-muted`                           |
| `text-gray-500`                    | Multiple pages         | `text-muted-foreground`              |
| `text-gray-600`                    | Multiple pages         | `text-muted-foreground`              |
| `border-gray-200`                  | Multiple pages         | `border-border`                      |
| `text-teal-600`                    | Hero section           | `text-primary`                       |
| `bg-teal-500`                      | DatePicker             | `bg-primary`                         |
| `bg-teal-50`                       | TimeSlotGrid           | `bg-primary/10`                      |
| `bg-green-50` / `text-green-600`   | BookingConfirmation    | `bg-success/10` / `text-success`     |
| `bg-orange-50` / `text-orange-600` | DatePicker (weekend)   | `bg-warning/10` / `text-warning`     |
| `bg-gray-100` / `text-gray-400`    | DatePicker (disabled)  | `bg-muted` / `text-muted-foreground` |

### 4.2 Dark Mode Support

| #   | Issue                                   | Priority     | Details                                                                                                                                                                               |
| --- | --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 57  | **No dark mode testing evident**        | **Critical** | The `.dark` class CSS variables exist in [`index.css`](frontend/src/index.css) but the pervasive hardcoded colors mean dark mode is effectively broken across the entire application. |
| 58  | **`theme-provider.tsx`** exists         | ✅ OK        | [`theme-provider.tsx`](frontend/src/components/theme-provider.tsx) is set up with `ThemeProvider` component.                                                                          |
| 59  | **Appearance toggle** exists in sidebar | ✅ OK        | [`Appearance.tsx`](frontend/src/components/Common/Appearance.tsx) provides light/dark/system toggle.                                                                                  |

### 4.3 Theme Token Usage

| Token File                                          | Status     | Notes                                                                                                      |
| --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| [`colors.ts`](frontend/src/theme/colors.ts)         | ✅ Defined | Complete palette with hex values. Not referenced in components (components use Tailwind classes directly). |
| [`typography.ts`](frontend/src/theme/typography.ts) | ✅ Defined | Font sizes defined. Not referenced in components.                                                          |
| [`spacing.ts`](frontend/src/theme/spacing.ts)       | ✅ Defined | Spacing values defined. Not referenced in components.                                                      |
| [`radius.ts`](frontend/src/theme/radius.ts)         | ✅ Defined | Radius values defined. Not referenced in components.                                                       |
| [`shadows.ts`](frontend/src/theme/shadows.ts)       | ✅ Defined | Shadow values defined. Not referenced in components.                                                       |

**Key Finding:** The theme token files are well-defined but **completely unused** by the components. Components use raw Tailwind classes directly. The theme files should be the single source of truth, but they are currently orphaned.

---

## Phase 5: Localization Audit

### 5.1 i18n Setup

| Aspect                 | Status | Details                                                                                                                       |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| i18next initialization | ✅ OK  | [`i18n/index.ts`](frontend/src/i18n/index.ts) properly configured with 3 languages, 9 namespaces, localStorage detector.      |
| Language count         | ✅ OK  | 3 languages: Vietnamese (`vi`), English (`en`), Ukrainian (`uk`).                                                             |
| Namespace count        | ✅ OK  | 9 namespaces: `common`, `auth`, `dashboard`, `doctors`, `availability`, `blockedDates`, `appointments`, `booking`, `landing`. |
| Fallback language      | ✅ OK  | `fallbackLng: "vi"` — Vietnamese as fallback.                                                                                 |
| Language detection     | ✅ OK  | localStorage detector with `lang` query parameter support.                                                                    |

### 5.2 Translation Completeness

| Namespace      | `en`        | `vi`        | `uk`        | Notes                                                              |
| -------------- | ----------- | ----------- | ----------- | ------------------------------------------------------------------ |
| `common`       | ✅ Complete | ✅ Complete | ✅ Complete | `uk/common.json` has extra `"footer"` key not in `en/common.json`. |
| `auth`         | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |
| `dashboard`    | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |
| `doctors`      | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |
| `availability` | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |
| `blockedDates` | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |
| `appointments` | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |
| `booking`      | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |
| `landing`      | ✅ Complete | ✅ Complete | ✅ Complete |                                                                    |

### 5.3 Localization Issues

| #   | Issue                             | Priority   | Details                                                                                                                                        |
| --- | --------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 60  | **Extra key in `uk/common.json`** | **Low**    | `uk/common.json` has `"footer": { "copyright": "..." }` not present in `en/common.json`. Should be added to English or removed from Ukrainian. |
| 61  | **Hardcoded text in components**  | **Medium** | Several components use hardcoded strings instead of `t()` function calls. See detailed list below.                                             |

### 5.4 Hardcoded Strings Found

| Component                                                                            | Hardcoded String                                   | Should Use                                               |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| [`BookingConfirmation.tsx`](frontend/src/components/Booking/BookingConfirmation.tsx) | "Đặt lịch thành công!", "Thông tin chi tiết"       | `t('booking:confirmation.success')` etc.                 |
| [`DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx)                   | "Hôm nay", "Ngày mai"                              | `t('booking:today')`, `t('booking:tomorrow')`            |
| [`TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx)               | "Cuối tuần", "Đã đặt hết", "Bác sĩ không khả dụng" | `t('booking:weekend')`, `t('booking:fully_booked')` etc. |
| [`StepIndicator.tsx`](frontend/src/components/Booking/StepIndicator.tsx)             | Step labels appear hardcoded                       | Should use `t('booking:step1')` etc.                     |
| [`PatientInfoForm.tsx`](frontend/src/components/Booking/PatientInfoForm.tsx)         | Form labels, validation messages                   | Some use `t()` but validation messages may be hardcoded. |

---

## Phase 6: Responsive Audit

### 6.1 Responsive Patterns

| Component                                                                     | Responsive Behavior                                                               | Status                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| [`Sidebar`](frontend/src/components/ui/sidebar.tsx)                           | Mobile: Sheet overlay, Tablet: auto-collapse, Desktop: collapsible icon/offcanvas | ✅ Excellent                         |
| [`BookingPage`](frontend/src/components/Booking/BookingPage.tsx)              | Mobile: stacked layout, Desktop: two-column                                       | ✅ Good (but duplicated clinic info) |
| [`StepIndicator`](frontend/src/components/Booking/StepIndicator.tsx)          | Connector width scales: `w-3 sm:w-10 md:w-16 lg:w-20`                             | ✅ Good                              |
| [`DoctorsDirectoryPage`](frontend/src/pages/DoctorsDirectoryPage.tsx)         | Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`                                 | ✅ Good                              |
| [`LandingPage`](frontend/src/pages/LandingPage.tsx)                           | Various responsive patterns                                                       | ✅ Good                              |
| [`AppointmentList`](frontend/src/components/Appointments/AppointmentList.tsx) | Table on desktop, cards on mobile                                                 | ✅ Good                              |

### 6.2 Responsive Issues

| #   | Issue                                    | Priority   | Details                                                                                                                                                  |
| --- | ---------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 62  | **No responsive audit of `DataTable`**   | **Medium** | [`DataTable.tsx`](frontend/src/components/Common/DataTable.tsx) may overflow on mobile. Need to verify horizontal scroll behavior.                       |
| 63  | **Booking wizard on very small screens** | **Medium** | [`BookingWizard.tsx`](frontend/src/components/Booking/BookingWizard.tsx) with 5 steps may be cramped on <360px width. StepIndicator circles may overlap. |
| 64  | **Touch targets on DatePicker**          | **Medium** | [`DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx) date cells should be minimum 44×44px per mobile rules. Verify.                        |

---

## Phase 7: Accessibility Audit

### 7.1 Accessibility Features Found

| Feature              | Status     | Details                                                                                                    |
| -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| ARIA labels on icons | ✅ Partial | Some Lucide icons have `aria-hidden` but not all interactive elements have labels.                         |
| Focus styles         | ✅ Partial | shadcn/ui components have focus rings, but custom components may not.                                      |
| Keyboard navigation  | ✅ Partial | shadcn/ui Select, Dialog support keyboard. Custom components (DatePicker, TimeSlotGrid) need verification. |
| Form validation      | ✅ Good    | Zod schemas with error messages.                                                                           |
| Loading states       | ✅ Good    | `LoadingButton`, `LoadingCard`, `Skeleton` components used.                                                |
| Empty states         | ✅ Good    | `EmptyState` component used.                                                                               |
| Error states         | ✅ Partial | Some error handling present.                                                                               |

### 7.2 Accessibility Issues

| #   | Issue                                         | Priority     | Details                                                                                                                                                                                           |
| --- | --------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 65  | **DatePicker missing keyboard navigation**    | **Critical** | [`DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx) uses `role="radiogroup"` but arrow key navigation between dates is not implemented. Users cannot navigate dates with keyboard. |
| 66  | **TimeSlotGrid missing keyboard navigation**  | **Critical** | [`TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx) time slots may not be keyboard accessible.                                                                                 |
| 67  | **Color contrast in dark mode**               | **Critical** | Since hardcoded colors break dark mode, contrast ratios in dark mode are unpredictable.                                                                                                           |
| 68  | **Missing `aria-label` on icon-only buttons** | **Medium**   | Some icon buttons (edit, delete actions) may lack accessible labels.                                                                                                                              |
| 69  | **Focus indicators on custom components**     | **Medium**   | `DoctorCard` (Booking), `DatePicker` cells, `TimeSlotGrid` buttons need visible focus indicators.                                                                                                 |
| 70  | **Skip-to-content link**                      | **Low**      | No skip navigation link found.                                                                                                                                                                    |

---

## Phase 8: Optimization

### 8.1 Duplicate Code

| #   | Issue                                    | Priority   | Details                                                                                                                                                                                                                   |
| --- | ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 71  | **Duplicate `DoctorCard`**               | **High**   | Two implementations: [`Booking/DoctorCard.tsx`](frontend/src/components/Booking/DoctorCard.tsx) (selectable card) and [`ui/DoctorCard.tsx`](frontend/src/components/ui/DoctorCard.tsx) (profile card). Should be unified. |
| 72  | **Duplicate clinic info in BookingPage** | **Medium** | Clinic identity rendered twice (mobile + desktop) in [`BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx).                                                                                                |

### 8.2 Unused Components

| #   | Component        | File                                                                                | Priority | Details                              |
| --- | ---------------- | ----------------------------------------------------------------------------------- | -------- | ------------------------------------ |
| 73  | `ClinicInfoCard` | [`components/ui/ClinicInfoCard.tsx`](frontend/src/components/ui/ClinicInfoCard.tsx) | **Low**  | Defined but never imported anywhere. |
| 74  | `Container`      | [`components/ui/Container.tsx`](frontend/src/components/ui/Container.tsx)           | **Low**  | Defined but never imported anywhere. |
| 75  | `CTASection`     | [`components/ui/CTASection.tsx`](frontend/src/components/ui/CTASection.tsx)         | **Low**  | Defined but never imported anywhere. |
| 76  | `button-group`   | [`components/ui/button-group.tsx`](frontend/src/components/ui/button-group.tsx)     | **Low**  | Defined but never imported anywhere. |

### 8.3 Unused Theme Exports

| #   | Export                 | File                                            | Priority | Details                                                                                                   |
| --- | ---------------------- | ----------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| 77  | `theme` object exports | [`theme/index.ts`](frontend/src/theme/index.ts) | **Low**  | Theme tokens are exported but not imported by any component. Components use raw Tailwind classes instead. |

### 8.4 Dead Code / Orphaned Files

| #   | File                                     | Priority | Details                                                                                              |
| --- | ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| 78  | `components/Common/Footer.tsx`           | **Low**  | Footer is defined but the actual footer used in `_layout.tsx` may be inline. Verify if this is used. |
| 79  | `components/Common/LanguageSwitcher.tsx` | **Low**  | LanguageSwitcher is defined but `_layout.tsx` may use it inline. Verify if this is used.             |

---

## Summary of Findings

### By Priority

| Priority     | Count | Key Areas                                                                                                                                                          |
| ------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Critical** | 12    | Hardcoded `bg-white`, `bg-slate-50`, `text-gray-500` across all pages; dark mode broken; DatePicker/TimeSlotGrid keyboard navigation missing; duplicate DoctorCard |
| **Medium**   | 22    | Hardcoded border colors, semantic colors, missing PageHeader usage, hardcoded strings, responsive concerns                                                         |
| **Low**      | 14    | Unused components, extra locale key, missing Container usage, orphaned theme exports                                                                               |

### By Phase

| Phase                    | Issues Found                                                  |
| ------------------------ | ------------------------------------------------------------- |
| Phase 1-2: Page Audit    | 54 issues across 14 pages                                     |
| Phase 3: Component Audit | 6 issues (duplicates, unused, missing)                        |
| Phase 4: Theme Audit     | 3 major issues (hardcoded colors, dark mode, orphaned tokens) |
| Phase 5: Localization    | 2 issues (extra key, hardcoded strings)                       |
| Phase 6: Responsive      | 3 issues                                                      |
| Phase 7: Accessibility   | 6 issues                                                      |
| Phase 8: Optimization    | 9 issues                                                      |

---

## Files Requiring Updates (Sprint 7.9)

### Critical Priority

| File                                                                                                             | Issue                                       | Suggested Fix                                                             |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| [`frontend/src/components/Landing/LandingHeader.tsx`](frontend/src/components/Landing/LandingHeader.tsx)         | Hardcoded `bg-white/95`                     | Replace with `bg-background/95 backdrop-blur-md`                          |
| [`frontend/src/components/Landing/HeroSection.tsx`](frontend/src/components/Landing/HeroSection.tsx)             | Hardcoded `bg-white`                        | Replace with `bg-background`                                              |
| [`frontend/src/components/Landing/AboutSection.tsx`](frontend/src/components/Landing/AboutSection.tsx)           | Hardcoded `bg-white`                        | Replace with `bg-background`                                              |
| [`frontend/src/components/Landing/ServicesSection.tsx`](frontend/src/components/Landing/ServicesSection.tsx)     | Hardcoded `bg-white`                        | Replace with `bg-background`                                              |
| [`frontend/src/components/Landing/ClinicInfoSection.tsx`](frontend/src/components/Landing/ClinicInfoSection.tsx) | Hardcoded `bg-white`                        | Replace with `bg-background`                                              |
| [`frontend/src/components/Landing/FinalCTASection.tsx`](frontend/src/components/Landing/FinalCTASection.tsx)     | Hardcoded `bg-white`                        | Replace with `bg-background`                                              |
| [`frontend/src/pages/DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx)                     | Hardcoded `bg-white` on cards               | Replace with `bg-card`                                                    |
| [`frontend/src/components/Booking/BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx)             | Hardcoded gradient `from-slate-50 to-white` | Replace with `from-background to-background` or use CSS variable gradient |
| [`frontend/src/components/Booking/BookingWizard.tsx`](frontend/src/components/Booking/BookingWizard.tsx)         | Hardcoded `bg-white` on Card                | Replace with `bg-card`                                                    |
| [`frontend/src/routes/_layout.tsx`](frontend/src/routes/_layout.tsx)                                             | Hardcoded `bg-slate-50`                     | Replace with `bg-background` or `bg-muted`                                |
| [`frontend/src/routes/_layout/admin.tsx`](frontend/src/routes/_layout/admin.tsx)                                 | Hardcoded `bg-white` on table               | Replace with `bg-card`                                                    |
| [`frontend/src/routes/_layout/blocked-dates.tsx`](frontend/src/routes/_layout/blocked-dates.tsx)                 | Hardcoded `bg-white` on cards               | Replace with `bg-card`                                                    |
| [`frontend/src/routes/_layout/settings.tsx`](frontend/src/routes/_layout/settings.tsx)                           | Hardcoded `bg-white` on cards               | Replace with `bg-card`                                                    |
| [`frontend/src/components/Dashboard/StatisticsCard.tsx`](frontend/src/components/Dashboard/StatisticsCard.tsx)   | Hardcoded `bg-white`                        | Replace with `bg-card`                                                    |
| [`frontend/src/components/Booking/DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx)               | Missing keyboard navigation                 | Implement arrow key navigation with `role="radiogroup"`                   |
| [`frontend/src/components/Booking/TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx)           | Missing keyboard navigation                 | Add `role="listbox"` with arrow key support                               |
| [`frontend/src/components/Booking/DoctorCard.tsx`](frontend/src/components/Booking/DoctorCard.tsx)               | Duplicate with `ui/DoctorCard.tsx`          | Unify with `ui/DoctorCard.tsx` or extend it                               |

### Medium Priority

| File                                                                                                                 | Issue                                   | Suggested Fix                                                             |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| [`frontend/src/components/Landing/ServicesSection.tsx`](frontend/src/components/Landing/ServicesSection.tsx)         | Hardcoded `border-gray-200`             | Replace with `border-border`                                              |
| [`frontend/src/pages/DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx)                         | Hardcoded `border-gray-200`             | Replace with `border-border`                                              |
| [`frontend/src/pages/DoctorsDirectoryPage.tsx`](frontend/src/pages/DoctorsDirectoryPage.tsx)                         | Hardcoded `text-[15px]`                 | Replace with `text-sm` (matches theme typography)                         |
| [`frontend/src/components/Booking/BookingPage.tsx`](frontend/src/components/Booking/BookingPage.tsx)                 | Duplicated clinic info                  | Use responsive CSS (hidden md:block / block md:hidden) on single instance |
| [`frontend/src/components/Booking/BookingWizard.tsx`](frontend/src/components/Booking/BookingWizard.tsx)             | Hardcoded `text-gray-500`               | Replace with `text-muted-foreground`                                      |
| [`frontend/src/components/Booking/StepIndicator.tsx`](frontend/src/components/Booking/StepIndicator.tsx)             | Hardcoded `border-gray-200`             | Replace with `border-border`                                              |
| [`frontend/src/components/Booking/DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx)                   | Hardcoded `bg-teal-500 text-white`      | Replace with `bg-primary text-primary-foreground`                         |
| [`frontend/src/components/Booking/DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx)                   | Hardcoded weekend colors                | Replace with `bg-warning/10 text-warning`                                 |
| [`frontend/src/components/Booking/DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx)                   | Hardcoded disabled colors               | Replace with `bg-muted text-muted-foreground`                             |
| [`frontend/src/components/Booking/TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx)               | Hardcoded selected slot colors          | Replace with `bg-primary/10 border-primary`                               |
| [`frontend/src/components/Booking/BookingConfirmation.tsx`](frontend/src/components/Booking/BookingConfirmation.tsx) | Hardcoded green colors                  | Replace with `bg-success/10 border-success/20 text-success`               |
| [`frontend/src/components/ui/AppointmentCard.tsx`](frontend/src/components/ui/AppointmentCard.tsx)                   | Hardcoded status badge colors           | Use `badge.tsx` variants with semantic colors                             |
| [`frontend/src/components/Booking/DatePicker.tsx`](frontend/src/components/Booking/DatePicker.tsx)                   | Hardcoded strings "Hôm nay", "Ngày mai" | Replace with `t('booking:today')`, `t('booking:tomorrow')`                |
| [`frontend/src/components/Booking/TimeSlotGrid.tsx`](frontend/src/components/Booking/TimeSlotGrid.tsx)               | Hardcoded empty state strings           | Replace with `t('booking:weekend')` etc.                                  |
| [`frontend/src/components/Booking/StepIndicator.tsx`](frontend/src/components/Booking/StepIndicator.tsx)             | Hardcoded step labels                   | Replace with `t('booking:step1')` etc.                                    |
| [`frontend/src/components/Booking/PatientInfoForm.tsx`](frontend/src/components/Booking/PatientInfoForm.tsx)         | Hardcoded validation messages           | Use `t()` for validation messages                                         |
| [`frontend/src/routes/_layout/dashboard.tsx`](frontend/src/routes/_layout/dashboard.tsx)                             | Missing `PageHeader`                    | Replace inline title with `<PageHeader>`                                  |
| [`frontend/src/routes/_layout/appointments.index.tsx`](frontend/src/routes/_layout/appointments.index.tsx)           | Missing `PageHeader`                    | Replace inline title with `<PageHeader>`                                  |
| [`frontend/src/routes/_layout/admin.tsx`](frontend/src/routes/_layout/admin.tsx)                                     | Missing `PageHeader`                    | Replace inline title with `<PageHeader>`                                  |
| [`frontend/src/routes/_layout/settings.tsx`](frontend/src/routes/_layout/settings.tsx)                               | Missing `PageHeader`                    | Replace inline title with `<PageHeader>`                                  |

### Low Priority

| File                                                                                                 | Issue                         | Suggested Fix                                                                       |
| ---------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| [`frontend/src/components/Landing/HeroSection.tsx`](frontend/src/components/Landing/HeroSection.tsx) | Hardcoded `text-teal-600`     | Replace with `text-primary`                                                         |
| [`frontend/src/components/Landing/*.tsx`](frontend/src/components/Landing/)                          | Missing `Container` component | Use `<Container>` from `components/ui/Container.tsx`                                |
| [`frontend/src/routes/_layout.tsx`](frontend/src/routes/_layout.tsx)                                 | Hardcoded padding             | Reference theme spacing tokens                                                      |
| [`frontend/src/routes/login.tsx`](frontend/src/routes/login.tsx)                                     | Hardcoded `text-gray-500`     | Replace with `text-muted-foreground`                                                |
| [`frontend/src/i18n/locales/uk/common.json`](frontend/src/i18n/locales/uk/common.json)               | Extra `footer` key            | Add `footer` key to `en/common.json` or remove from `uk/common.json`                |
| [`frontend/src/components/ui/ClinicInfoCard.tsx`](frontend/src/components/ui/ClinicInfoCard.tsx)     | Unused component              | Either use it in BookingPage or remove                                              |
| [`frontend/src/components/ui/Container.tsx`](frontend/src/components/ui/Container.tsx)               | Unused component              | Either use it across pages or remove                                                |
| [`frontend/src/components/ui/CTASection.tsx`](frontend/src/components/ui/CTASection.tsx)             | Unused component              | Either use it in Landing page or remove                                             |
| [`frontend/src/components/ui/button-group.tsx`](frontend/src/components/ui/button-group.tsx)         | Unused component              | Either use it or remove                                                             |
| [`frontend/src/theme/*.ts`](frontend/src/theme/)                                                     | Orphaned theme exports        | Either integrate into components or remove if CSS variables are the source of truth |
| [`frontend/src/routes/_layout/dashboard.tsx`](frontend/src/routes/_layout/dashboard.tsx)             | Skip-to-content link missing  | Add skip navigation link for accessibility                                          |

---

## Estimated Implementation Effort (Sprint 7.9)

| Category                                                                   | Files to Modify | Estimated Effort | Complexity                       |
| -------------------------------------------------------------------------- | --------------- | ---------------- | -------------------------------- |
| **Critical: Replace hardcoded `bg-white`/`bg-slate-50` with theme tokens** | ~15 files       | **4-6 hours**    | Low (search & replace)           |
| **Critical: Fix DatePicker/TimeSlotGrid keyboard navigation**              | 2 files         | **3-4 hours**    | High (logic changes)             |
| **Critical: Unify duplicate DoctorCard components**                        | 2 files         | **2-3 hours**    | Medium (refactoring)             |
| **Medium: Replace hardcoded semantic colors**                              | ~8 files        | **2-3 hours**    | Low (search & replace)           |
| **Medium: Replace hardcoded strings with i18n**                            | ~5 files        | **2-3 hours**    | Low (add translations + replace) |
| **Medium: Add PageHeader to pages**                                        | 4 files         | **1 hour**       | Low                              |
| **Medium: Fix duplicated clinic info**                                     | 1 file          | **1 hour**       | Low                              |
| **Low: Remove unused components**                                          | 4 files         | **30 min**       | Low                              |
| **Low: Fix extra locale key**                                              | 1 file          | **15 min**       | Low                              |
| **Low: Add skip-to-content link**                                          | 1 file          | **30 min**       | Low                              |

### Total Estimated Effort: **16-22 hours** (2-3 developer days)

### Recommended Sprint 7.9 Execution Order

1. **Day 1 (Critical):** Replace all hardcoded `bg-white`/`bg-slate-50`/`text-gray-*` with theme CSS variables across all files. This is the highest-impact change.
2. **Day 1-2 (Critical):** Fix DatePicker and TimeSlotGrid keyboard navigation. Unify DoctorCard components.
3. **Day 2 (Medium):** Replace hardcoded semantic colors, add i18n translations, add PageHeader components.
4. **Day 3 (Low):** Remove unused components, fix locale key, add skip-to-content link.

---

## Appendix A: Design System Document Status

| Document                                                             | Status      | Notes                                                   |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| [`00_INDEX.md`](docs/frontent/00_INDEX.md)                           | ✅ Complete | Index listing                                           |
| [`01_UI_GUIDE.md`](docs/frontent/01_UI_GUIDE.md)                     | ⚠️ Partial  | Contains vision/philosophy but no specific token values |
| [`02_COLOR_SYSTEM.md`](docs/frontent/02_COLOR_SYSTEM.md)             | ❌ Stub     | Just color names without hex values                     |
| [`03_COMPONENT_LIBRARY.md`](docs/frontent/03_COMPONENT_LIBRARY.md)   | ❌ Stub     | Just component names without APIs                       |
| [`04_LAYOUT_RULES.md`](docs/frontent/04_LAYOUT_RULES.md)             | ❌ Stub     | Brief outlines only                                     |
| [`05_BOOKING_UI.md`](docs/frontent/05_BOOKING_UI.md)                 | ❌ Empty    | Just says "Define everything"                           |
| [`06_MOBILE_RULES.md`](docs/frontent/06_MOBILE_RULES.md)             | ⚠️ Partial  | Has some rules but incomplete                           |
| [`07_ACCESSIBILITY.md`](docs/frontent/07_ACCESSIBILITY.md)           | ❌ Stub     | Just keywords                                           |
| [`08_ROO_FRONTEND_RULES.md`](docs/frontent/08_ROO_FRONTEND_RULES.md) | ✅ Complete | Actionable rules                                        |
| [`DESIGN_DECISIONS.md`](docs/frontent/DESIGN_DECISIONS.md)           | ✅ Complete | Design rationale documented                             |

**Recommendation:** The Design System documents should be updated to include actual specifications (hex values, component APIs, layout rules) to serve as a proper single source of truth. Currently, the theme token files (`frontend/src/theme/*.ts`) and `index.css` are the de facto design system.

## Appendix B: Theme Token vs CSS Variable Mapping

| Theme Token File          | CSS Variable (index.css)            | Tailwind Utility              | Status              |
| ------------------------- | ----------------------------------- | ----------------------------- | ------------------- |
| `colors.primary.DEFAULT`  | `--color-primary: #14b8a6`          | `bg-primary` / `text-primary` | ✅ Defined          |
| `colors.primary.light`    | `--color-primary-light: #5eead4`    | `text-primary-light`          | ✅ Defined          |
| `colors.background.light` | `--color-background: #f8fafc`       | `bg-background`               | ✅ Defined          |
| `colors.background.dark`  | `--color-background-dark: #12343b`  | `bg-background` (in `.dark`)  | ✅ Defined          |
| `colors.text.primary`     | `--color-foreground: #1f2937`       | `text-foreground`             | ✅ Defined          |
| `colors.text.muted`       | `--color-muted-foreground: #6b7280` | `text-muted-foreground`       | ✅ Defined          |
| `colors.semantic.success` | `--color-success: #10b981`          | `text-success` / `bg-success` | ✅ Defined          |
| `colors.semantic.warning` | `--color-warning: #f59e0b`          | `text-warning` / `bg-warning` | ✅ Defined          |
| `colors.semantic.error`   | `--color-error: #ef4444`            | `text-error` / `bg-error`     | ✅ Defined          |
| `spacing.section.default` | N/A (Tailwind only)                 | `py-24 md:py-32`              | ✅ Defined in theme |
| `radius.card`             | `--radius: 1rem`                    | `rounded-2xl`                 | ✅ Defined          |
| `radius.button`           | N/A                                 | `rounded-xl`                  | ✅ Defined in theme |

---

## Appendix C: Classified Action Items

This appendix reclassifies all findings using the **Required / Recommended / Optional** taxonomy, evaluated against product-first priorities:

1. **Correct Architecture** — highest priority
2. **Business Logic** — second priority
3. **Reusability** — third priority
4. **Maintainability** — fourth priority
5. **User Experience (UX)** — fifth priority
6. **Performance** — sixth priority
7. **Visual Consistency** — seventh priority
8. **Visual Polish** — lowest priority

### Required (Must Implement)

These items affect architecture, business logic, reusability, or have real usability/accessibility impact. Skipping them would degrade the SaaS platform's long-term value.

| # | Finding | Priority | Rationale |
|---|---------|----------|-----------|
| 65 | **DatePicker missing keyboard navigation** | **Required** | Accessibility is a real usability problem. Keyboard-only users cannot book appointments. Affects business logic (booking flow). |
| 66 | **TimeSlotGrid missing keyboard navigation** | **Required** | Same as above — keyboard-only users cannot select time slots. |
| 55 | **Duplicate DoctorCard components** | **Required** | Violates reusability principle. Two implementations of the same concept increases maintenance burden. Should be unified. |
| 71 | **Duplicate DoctorCard (Optimization)** | **Required** | Same as above — listed in both Component Audit and Optimization phases. |
| 61 | **Hardcoded strings in booking components** | **Required** | Affects business logic for multi-language clinics. Booking flow strings hardcoded in Vietnamese breaks English/Ukrainian users. |
| 57 | **Dark mode broken by hardcoded colors** | **Required** | Affects UX for users who prefer dark mode. The infrastructure exists (CSS variables, theme-provider, appearance toggle) but hardcoded colors make it non-functional. |

### Recommended (Should Implement)

These items improve maintainability, visual consistency, or UX. They provide clear value but are not blocking.

| # | Finding | Priority | Rationale |
|---|---------|----------|-----------|
| 1-2 | Hardcoded `bg-white` on Landing sections | **Recommended** | Replacing with `bg-background` enables dark mode. High impact, low effort. |
| 8 | Hardcoded `bg-white` on DoctorsDirectory cards | **Recommended** | Same pattern — enables dark mode for doctor cards. |
| 15-16 | Hardcoded gradient/`bg-white` on BookingPage | **Recommended** | Enables dark mode for booking flow. |
| 20 | Hardcoded `bg-white` on BookingWizard Card | **Recommended** | Enables dark mode for wizard. |
| 30 | Hardcoded `bg-slate-50` on layout | **Recommended** | Enables dark mode for main content area. |
| 39 | Hardcoded `bg-white` on Admin table | **Recommended** | Enables dark mode for admin. |
| 45 | Hardcoded `bg-white` on BlockedDates cards | **Recommended** | Enables dark mode for blocked dates. |
| 52 | Hardcoded `bg-white` on Settings cards | **Recommended** | Enables dark mode for settings. |
| 54 | Hardcoded `bg-white` on Dashboard stat cards | **Recommended** | Enables dark mode for dashboard. |
| 23-29 | Hardcoded semantic colors in Booking components | **Recommended** | Replace `bg-teal-500` → `bg-primary`, `bg-green-50` → `bg-success/10`, etc. Enables theming. |
| 43 | Hardcoded status badge colors in AppointmentCard | **Recommended** | Use `badge.tsx` variants with semantic colors for consistency. |
| 67 | Color contrast in dark mode | **Recommended** | Will be resolved once hardcoded colors are replaced with CSS variables. |
| 68 | Missing `aria-label` on icon-only buttons | **Recommended** | Accessibility improvement for screen readers. |
| 69 | Focus indicators on custom components | **Recommended** | Accessibility improvement for keyboard navigation. |
| 70 | Skip-to-content link | **Recommended** | Accessibility best practice. |
| 60 | Extra `footer` key in `uk/common.json` | **Recommended** | Maintainability — keeps locale files in sync. |

### Optional (Consider During Future Work)

These items are visual polish, theoretical improvements, or cosmetic. They should only be implemented if time permits or when touching the file for other reasons.

| # | Finding | Priority | Rationale |
|---|---------|----------|-----------|
| 3 | Hardcoded `text-gray-600` for body text | **Optional** | Visual consistency only. Does not affect functionality. |
| 4 | Hardcoded `text-teal-600` in Hero | **Optional** | Visual polish. Works fine as-is. |
| 5 | No `PageHeader` on Landing page | **Optional** | Landing page has its own design — acceptable. |
| 6 | No `Container` component on Landing | **Optional** | `max-w-7xl mx-auto px-4` works identically. |
| 7 | Hardcoded `border-gray-200` | **Optional** | Visual consistency only. |
| 9 | Hardcoded `border-gray-200` on directory | **Optional** | Visual consistency only. |
| 10 | Hardcoded `text-[15px]` | **Optional** | Matches `text-sm` (15px) — functionally identical. |
| 17 | Duplicated clinic info in BookingPage | **Optional** | Works correctly. Refactoring is cosmetic. |
| 18 | No `PageHeader` on Booking page | **Optional** | Wizard has its own header pattern — acceptable. |
| 31 | Hardcoded padding on layout | **Optional** | Visual polish. |
| 36 | Hardcoded `text-gray-500` on login | **Optional** | Visual consistency only. |
| 38 | No `PageHeader` on Admin page | **Optional** | Inline title works fine. |
| 51 | No `PageHeader` on Settings page | **Optional** | Inline title works fine. |
| 53 | No `PageHeader` on Dashboard page | **Optional** | Inline title works fine. |
| 62 | DataTable responsive audit | **Optional** | Investigate if time permits. |
| 63 | Booking wizard on very small screens | **Optional** | Edge case — <360px devices are rare. |
| 64 | Touch targets on DatePicker | **Optional** | Verify if time permits. |
| 73-76 | Unused components (ClinicInfoCard, Container, CTASection, button-group) | **Optional** | Remove only if they cause confusion. They don't affect the build. |
| 77 | Orphaned theme exports | **Optional** | The CSS variables in `index.css` are the actual source of truth. Theme TS files are documentation. |

### Summary

| Classification | Count | Estimated Effort |
|----------------|-------|-----------------|
| **Required** | 8 | 8-12 hours |
| **Recommended** | 21 | 6-10 hours |
| **Optional** | 19 | 2-4 hours |

**Sprint 7.9 Recommendation:** Implement **Required** items first (accessibility + reusability fixes), then **Recommended** items (dark mode enablement + semantic colors). Skip **Optional** items unless touching those files for other reasons.

---

*End of Report — Sprint 7.8 UI Consistency Audit*
