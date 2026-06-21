import { useSuspenseQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

import { AppointmentsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingItems from "@/components/Pending/PendingItems"
import { buildColumns } from "./columns"

function getAppointmentsQueryOptions() {
  return {
    queryFn: () =>
      AppointmentsService.readAppointments({ skip: 0, limit: 100 }),
    queryKey: ["appointments"],
  }
}

function AppointmentsTableContent() {
  const { t } = useTranslation("appointments")
  const { data: appointments } = useSuspenseQuery(getAppointmentsQueryOptions())

  if (appointments.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Search className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("list.empty")}</h3>
      </div>
    )
  }

  return <DataTable columns={buildColumns()} data={appointments.data} />
}

function AppointmentsTable() {
  return (
    <Suspense fallback={<PendingItems />}>
      <AppointmentsTableContent />
    </Suspense>
  )
}

export function AppointmentList() {
  const { t } = useTranslation(["appointments", "common"])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("appointments:title")}
          </h1>
          <p className="text-muted-foreground">
            {t("appointments:list.title")}
          </p>
        </div>
      </div>
      <AppointmentsTable />
    </div>
  )
}
