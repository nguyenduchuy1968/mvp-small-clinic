import { CalendarCheck, Clock, Star, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/ui/StatCard"
import { spacing } from "@/theme/spacing"

const indicators: Array<{
  key: string
  value: string
  icon: typeof Users
  suffix?: string
}> = [
  {
    key: "patients",
    value: "5000+",
    icon: Users,
  },
  {
    key: "years",
    value: "12+",
    icon: CalendarCheck,
  },
  {
    key: "rating",
    value: "4.9",
    icon: Star,
    suffix: "\u2605",
  },
  {
    key: "waitingTime",
    value: "15",
    icon: Clock,
    suffix: "min",
  },
]

export function TrustIndicatorsSection() {
  const { t } = useTranslation("landing")

  return (
    <section className={`bg-white px-4 ${spacing.section.compact}`}>
      <div className={`mx-auto ${spacing.container.narrow}`}>
        <div
          className={`grid grid-cols-2 ${spacing.grid.compact} md:grid-cols-4`}
        >
          {indicators.map((indicator) => (
            <StatCard
              key={indicator.key}
              icon={indicator.icon}
              value={indicator.value}
              label={t(`trustIndicators.${indicator.key}`)}
              suffix={indicator.suffix}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
