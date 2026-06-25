import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { useTranslation } from "react-i18next"

import { clinicConfig } from "@/config/clinic"
import { services } from "@/config/services"

export function LandingFooter() {
  const { t, i18n } = useTranslation("landing")
  const currentYear = new Date().getFullYear()

  const isVietnamese = i18n.language?.startsWith("vi")
  const clinicName = isVietnamese ? clinicConfig.name : clinicConfig.nameEn
  const address = isVietnamese ? clinicConfig.address : clinicConfig.addressEn

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="bg-[#052049] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 text-xl font-bold text-white mb-4 transition-opacity hover:opacity-80"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-white text-sm font-bold">
                H
              </div>
              {clinicName}
            </button>
            <p className="text-sm text-blue-200 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-4">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-3">
              {[
                { key: "home", sectionId: "hero-section" },
                { key: "services", sectionId: "services-section" },
                { key: "doctors", sectionId: "doctors-section" },
                { key: "about", sectionId: "about-section" },
                { key: "contact", sectionId: "contact-section" },
              ].map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => scrollToSection(item.sectionId)}
                    className="text-sm text-blue-200 transition-colors hover:text-white"
                  >
                    {t(`nav.${item.key}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-4">
              {t("footer.services")}
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.key}>
                  <span className="text-sm text-blue-200">
                    {t(`services.${service.key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Working Hours */}
          <div>
            <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-4">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                <span className="text-sm text-blue-200">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-teal-400" />
                <span className="text-sm text-blue-200">
                  {clinicConfig.phone}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-teal-400" />
                <span className="text-sm text-blue-200">
                  {clinicConfig.email}
                </span>
              </li>
            </ul>

            <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mt-8 mb-4">
              {t("footer.workingHours")}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-teal-400" />
                <div className="flex flex-1 justify-between text-sm">
                  <span className="text-blue-200">{t("footer.weekday")}</span>
                  <span className="text-white font-medium">
                    {clinicConfig.workingHours.weekday}
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-teal-400" />
                <div className="flex flex-1 justify-between text-sm">
                  <span className="text-blue-200">{t("footer.saturday")}</span>
                  <span className="text-white font-medium">
                    {clinicConfig.workingHours.saturday}
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-teal-400" />
                <div className="flex flex-1 justify-between text-sm">
                  <span className="text-blue-200">{t("footer.sunday")}</span>
                  <span className="text-white font-medium">
                    {clinicConfig.workingHours.sunday}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-blue-200">
              {t("footer.copyright", { year: currentYear })}
            </p>
            <div className="flex items-center gap-6">
              <button className="text-sm text-blue-200 transition-colors hover:text-white">
                {t("footer.privacyPolicy")}
              </button>
              <button className="text-sm text-blue-200 transition-colors hover:text-white">
                {t("footer.terms")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
