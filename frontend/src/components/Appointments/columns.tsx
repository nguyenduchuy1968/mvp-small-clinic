import type { ColumnDef } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import type { AppointmentPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { AppointmentActionsMenu } from "./AppointmentActionsMenu"

export function buildColumns(): ColumnDef<AppointmentPublic>[] {
  const columns: ColumnDef<AppointmentPublic>[] = [
    {
      accessorKey: "appointment_date",
      header: () => {
        const { t } = useTranslation("appointments")
        return <>{t("list.columns.date")}</>
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.appointment_date}</span>
      ),
    },
    {
      accessorKey: "appointment_time",
      header: () => {
        const { t } = useTranslation("appointments")
        return <>{t("list.columns.time")}</>
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.appointment_time}
        </span>
      ),
    },
    {
      accessorKey: "patient_name",
      header: () => {
        const { t } = useTranslation("appointments")
        return <>{t("list.columns.patientName")}</>
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.patient_name}</span>
      ),
    },
    {
      accessorKey: "patient_phone",
      header: () => {
        const { t } = useTranslation("appointments")
        return <>{t("list.columns.patientPhone")}</>
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.patient_phone}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => {
        const { t } = useTranslation("appointments")
        return <>{t("list.columns.status")}</>
      },
      cell: ({ row }) => {
        const { t } = useTranslation("appointments")
        const status = row.original.status
        const variant = status === "confirmed" ? "default" : "destructive"
        const label =
          status === "confirmed" ? t("status.confirmed") : t("status.cancelled")
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      id: "actions",
      header: () => {
        const { t } = useTranslation("common")
        return <span className="sr-only">{t("actions.filter")}</span>
      },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <AppointmentActionsMenu appointment={row.original} />
        </div>
      ),
    },
  ]

  return columns
}
