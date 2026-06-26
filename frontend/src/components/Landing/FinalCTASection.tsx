import { useNavigate } from "@tanstack/react-router"
import { Calendar } from "lucide-react"
import { useTranslation } from "react-i18next"

import { CTASection } from "@/components/ui/CTASection"

export function FinalCTASection() {
  const { t } = useTranslation("landing")
  const navigate = useNavigate()

  return (
    <CTASection
      title={t("cta.title")}
      description={t("cta.description")}
      buttonLabel={t("cta.bookAppointment")}
      buttonIcon={Calendar}
      onButtonClick={() => navigate({ to: "/booking" })}
      variant="gradient"
    />
  )
}
