import { useTranslation } from "react-i18next"

import type { AppointmentStatus } from "@/client"
import { Badge } from "@/components/ui/badge"

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | undefined | null
}

const variantMap: Record<string, "default" | "secondary" | "destructive"> = {
  confirmed: "default",
  cancelled: "destructive",
  pending: "secondary",
}

export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  const { t } = useTranslation("appointments")

  if (!status) return null

  const variant = variantMap[status] ?? "secondary"
  const label = t(`status.${status}`, { defaultValue: status })

  return <Badge variant={variant}>{label}</Badge>
}
