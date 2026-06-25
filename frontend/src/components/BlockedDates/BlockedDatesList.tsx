import { useSuspenseQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"

import { BlockedDatesService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import PendingItems from "@/components/Pending/PendingItems"
import CreateBlockedDates from "./CreateBlockedDates"
import { columns } from "./columns"

function getBlockedDatesQueryOptions(doctorId: string) {
  return {
    queryFn: () =>
      BlockedDatesService.readBlockedDates({
        doctorId,
        skip: 0,
        limit: 100,
      }),
    queryKey: ["blocked-dates", doctorId],
    enabled: !!doctorId,
  }
}

interface BlockedDatesTableContentProps {
  doctorId: string
}

function BlockedDatesTableContent({ doctorId }: BlockedDatesTableContentProps) {
  const { t } = useTranslation("blockedDates")
  const { data: blockedDates } = useSuspenseQuery(
    getBlockedDatesQueryOptions(doctorId),
  )

  if (blockedDates.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("list.empty")}</h3>
      </div>
    )
  }

  return <DataTable columns={columns} data={blockedDates.data} />
}

interface BlockedDatesTableProps {
  doctorId: string
}

function BlockedDatesTable({ doctorId }: BlockedDatesTableProps) {
  return (
    <Suspense fallback={<PendingItems />}>
      <BlockedDatesTableContent doctorId={doctorId} />
    </Suspense>
  )
}

interface BlockedDatesListProps {
  doctorId: string
}

export function BlockedDatesList({ doctorId }: BlockedDatesListProps) {
  const { t } = useTranslation(["blockedDates", "common"])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("blockedDates:title")}
          </h1>
          <p className="text-muted-foreground">
            {t("blockedDates:list.title")}
          </p>
        </div>
        <CreateBlockedDates doctorId={doctorId} />
      </div>
      <BlockedDatesTable doctorId={doctorId} />
    </div>
  )
}
