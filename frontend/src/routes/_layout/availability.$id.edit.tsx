import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import type { Weekday } from "@/client"
import {
  AvailabilityForm,
  type AvailabilityFormData,
} from "@/components/Availability/AvailabilityForm"
import { useUpdateAvailability } from "@/hooks/useUpdateAvailability"

function EditAvailabilityPage() {
  const { t } = useTranslation(["availability", "common"])
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const updateAvailability = useUpdateAvailability()

  const onSubmit = (data: AvailabilityFormData) => {
    const payload = {
      weekday: data.weekday as Weekday,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: data.duration_minutes
        ? Number(data.duration_minutes)
        : null,
      is_active: data.is_active,
    }
    updateAvailability.mutate(
      { availabilityId: id, requestBody: payload },
      {
        onSuccess: () => {
          navigate({ to: "/availability" })
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("availability:edit.title")}
        </h1>
        <p className="text-muted-foreground">{t("availability:edit.title")}</p>
      </div>
      <AvailabilityForm
        onSubmit={onSubmit}
        isPending={updateAvailability.isPending}
      />
    </div>
  )
}

export const Route = createFileRoute("/_layout/availability/$id/edit")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Edit Schedule",
      },
    ],
  }),
})

function RouteComponent() {
  return <EditAvailabilityPage />
}
