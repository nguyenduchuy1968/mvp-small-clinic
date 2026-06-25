import { useSuspenseQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import type { AppointmentPublic } from "@/client"
import { AppointmentsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingItems from "@/components/Pending/PendingItems"
import { Input } from "@/components/ui/input"
import { isClinicToday, isPastAppointment } from "@/utils/date"
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
  const navigate = useNavigate()
  const { data: appointments } = useSuspenseQuery(getAppointmentsQueryOptions())
  const [searchQuery, setSearchQuery] = useState("")

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return appointments.data

    const query = searchQuery.trim().toLowerCase()
    return appointments.data.filter(
      (appt) =>
        appt.booking_number?.toLowerCase().includes(query) ||
        appt.patient_name?.toLowerCase().includes(query) ||
        appt.patient_phone?.toLowerCase().includes(query),
    )
  }, [appointments.data, searchQuery])

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

  const handleRowClick = (row: AppointmentPublic) => {
    navigate({ to: "/appointments/$id", params: { id: row.id } })
  }

  const getRowClassName = (row: AppointmentPublic): string | undefined => {
    // Past appointments get muted styling
    if (isPastAppointment(row.appointment_date, row.appointment_time)) {
      return "text-muted-foreground opacity-60"
    }
    // Today's non-cancelled appointments get a subtle highlight
    if (row.status !== "cancelled" && isClinicToday(row.appointment_date)) {
      return "bg-primary/15"
    }
    return undefined
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("list.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{t("list.empty")}</h3>
        </div>
      ) : (
        <DataTable
          columns={buildColumns()}
          data={filteredData}
          onRowClick={handleRowClick}
          getRowClassName={getRowClassName}
        />
      )}
    </div>
  )
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
