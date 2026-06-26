import type { LucideIcon } from "lucide-react"
import { Baby, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SectionHeader } from "@/components/ui/SectionHeader"
import { ServiceCard } from "@/components/ui/ServiceCard"
import { services } from "@/config/services"
import { spacing } from "@/theme/spacing"

const iconMap: Record<string, LucideIcon> = {
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
        <SectionHeader title={t("services.title")} />
        <div
          className={`mt-16 grid ${spacing.grid.default} sm:grid-cols-2 lg:grid-cols-4`}
        >
          {services.map((service) => {
            const Icon = (iconMap[service.key] ?? Stethoscope) as LucideIcon
            return (
              <ServiceCard
                key={service.key}
                icon={Icon}
                title={t(`services.${service.key}`)}
                description={t(`services.${service.key}Desc`)}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
