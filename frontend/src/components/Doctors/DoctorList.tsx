import { useSuspenseQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

import { DoctorsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingItems from "@/components/Pending/PendingItems"
import useAuth from "@/hooks/useAuth"
import CreateDoctor from "./CreateDoctor"
import { buildColumns } from "./columns"

function getDoctorsQueryOptions() {
  return {
    queryFn: () => DoctorsService.readDoctors({ skip: 0, limit: 100 }),
    queryKey: ["doctors"],
  }
}

function DoctorsTableContent() {
  const { t } = useTranslation("doctors")
  const { data: doctors } = useSuspenseQuery(getDoctorsQueryOptions())
  const { user } = useAuth()

  if (doctors.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("list.empty")}</h3>
      </div>
    )
  }

  return <DataTable columns={buildColumns(user)} data={doctors.data} />
}

function DoctorsTable() {
  return (
    <Suspense fallback={<PendingItems />}>
      <DoctorsTableContent />
    </Suspense>
  )
}

export function DoctorList() {
  const { t } = useTranslation(["doctors", "common"])
  const { user } = useAuth()

  const canManageDoctors = user?.is_superuser === true

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("doctors:title")}
          </h1>
          <p className="text-muted-foreground">{t("doctors:list.title")}</p>
        </div>
        {canManageDoctors && <CreateDoctor />}
      </div>
      <DoctorsTable />
    </div>
  )
}
