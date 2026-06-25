import { Baby, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react"
import { useTranslation } from "react-i18next"

import { services } from "@/config/services"
import { radius } from "@/theme/radius"
import { spacing } from "@/theme/spacing"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  generalConsultation: Stethoscope,
  internalMedicine: HeartPulse,
  pediatrics: Baby,
  preventiveCare: ShieldCheck,
}

export function ServicesSection() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="services-section"
      className={`bg-white px-4 ${spacing.section.default}`}
    >
      <div className={`mx-auto ${spacing.container.narrow}`}>
        <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          {t("services.title")}
        </h2>
        <div
          className={`mt-16 grid ${spacing.grid.default} sm:grid-cols-2 lg:grid-cols-4`}
        >
          {services.map((service) => {
            const Icon = iconMap[service.key]
            return (
              <div
                key={service.key}
                className={`group ${radius.card.DEFAULT} border border-gray-200 bg-[#F9FAFB] ${spacing.card.default} text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-200`}
              >
                {Icon && (
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-300 group-hover:bg-teal-100 group-hover:scale-110">
                    <Icon className="h-7 w-7" />
                  </div>
                )}
                <h3 className="mt-5 text-[22px] font-semibold text-gray-900">
                  {t(`services.${service.key}`)}
                </h3>
                <p className="mt-3 text-[19px] text-gray-500 leading-relaxed">
                  {t(`services.${service.key}Desc`)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
