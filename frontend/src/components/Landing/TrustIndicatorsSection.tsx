import type { LucideIcon } from "lucide-react"
import { CalendarCheck, Clock, Star, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { radius } from "@/theme/radius"
import { spacing } from "@/theme/spacing"

interface Indicator {
  key: string
  value: string
  icon: LucideIcon
  suffix?: string
}

const indicators: Indicator[] = [
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
          {indicators.map((indicator) => {
            const Icon = indicator.icon
            return (
              <div
                key={indicator.key}
                className={`flex flex-col items-center justify-center ${radius.card.DEFAULT} border border-blue-100 bg-blue-50/60 px-4 py-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-200`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-all duration-300">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {indicator.value}
                  {indicator.suffix && (
                    <span className="ml-0.5 text-2xl sm:text-3xl">
                      {indicator.suffix}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[15px] font-medium text-gray-500 sm:text-[17px]">
                  {t(`trustIndicators.${indicator.key}`)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
