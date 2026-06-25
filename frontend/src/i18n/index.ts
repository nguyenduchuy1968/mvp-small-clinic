import i18next from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import appointmentsEn from "./locales/en/appointments.json"
import authEn from "./locales/en/auth.json"
import availabilityEn from "./locales/en/availability.json"
import blockedDatesEn from "./locales/en/blockedDates.json"
import bookingEn from "./locales/en/booking.json"
import commonEn from "./locales/en/common.json"
import dashboardEn from "./locales/en/dashboard.json"
import doctorsEn from "./locales/en/doctors.json"
import landingEn from "./locales/en/landing.json"
import appointmentsUk from "./locales/uk/appointments.json"
import authUk from "./locales/uk/auth.json"
import availabilityUk from "./locales/uk/availability.json"
import blockedDatesUk from "./locales/uk/blockedDates.json"
import bookingUk from "./locales/uk/booking.json"
import commonUk from "./locales/uk/common.json"
import dashboardUk from "./locales/uk/dashboard.json"
import doctorsUk from "./locales/uk/doctors.json"
import landingUk from "./locales/uk/landing.json"
import appointmentsVi from "./locales/vi/appointments.json"
import authVi from "./locales/vi/auth.json"
import availabilityVi from "./locales/vi/availability.json"
import blockedDatesVi from "./locales/vi/blockedDates.json"
import bookingVi from "./locales/vi/booking.json"
import commonVi from "./locales/vi/common.json"
import dashboardVi from "./locales/vi/dashboard.json"
import doctorsVi from "./locales/vi/doctors.json"
import landingVi from "./locales/vi/landing.json"

const resources = {
  vi: {
    common: commonVi,
    auth: authVi,
    dashboard: dashboardVi,
    doctors: doctorsVi,
    availability: availabilityVi,
    blockedDates: blockedDatesVi,
    appointments: appointmentsVi,
    booking: bookingVi,
    landing: landingVi,
  },
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    doctors: doctorsEn,
    availability: availabilityEn,
    blockedDates: blockedDatesEn,
    appointments: appointmentsEn,
    booking: bookingEn,
    landing: landingEn,
  },
  uk: {
    common: commonUk,
    auth: authUk,
    dashboard: dashboardUk,
    doctors: doctorsUk,
    availability: availabilityUk,
    blockedDates: blockedDatesUk,
    appointments: appointmentsUk,
    booking: bookingUk,
    landing: landingUk,
  },
}

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "vi",
    supportedLngs: ["vi", "en", "uk"],
    defaultNS: "common",
    ns: [
      "common",
      "auth",
      "dashboard",
      "doctors",
      "availability",
      "blockedDates",
      "appointments",
      "booking",
      "landing",
    ],
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export default i18next
