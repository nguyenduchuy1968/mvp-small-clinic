import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { OpenAPI } from "@/client"
import { BookingConfirmation } from "@/components/Booking/BookingConfirmation"

/**
 * Fetch an appointment by ID using the public endpoint (no auth required).
 * This avoids the 403 error that would occur when calling the authenticated
 * readAppointment endpoint as an unauthenticated patient.
 */
async function fetchAppointmentPublic(appointmentId: string) {
  const response = await fetch(
    `${OpenAPI.BASE}/api/v1/public/appointments/${appointmentId}`,
  )
  if (!response.ok) {
    throw new Error("Failed to fetch appointment")
  }
  return response.json()
}

export const Route = createFileRoute("/booking/confirmation")({
  component: BookingConfirmationPage,
  validateSearch: (
    search: Record<string, unknown>,
  ): { appointmentId?: string } => {
    return {
      appointmentId: search.appointmentId as string | undefined,
    }
  },
  head: () => ({
    meta: [
      {
        title: "Appointment Confirmed",
      },
    ],
  }),
})

function BookingConfirmationPage() {
  const { appointmentId } = Route.useSearch()
  const { t } = useTranslation("booking")

  const { data: appointment, isLoading } = useQuery({
    queryFn: () => fetchAppointmentPublic(appointmentId!),
    queryKey: ["appointment", "public", appointmentId],
    enabled: !!appointmentId,
  })

  if (!appointmentId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {t("common:states.notFound", "Not found")}
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {t("common:states.loading", "Loading...")}
        </p>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {t("common:states.notFound", "Not found")}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">{t("confirmation.title")}</h1>
      </header>
      <main className="mx-auto max-w-4xl p-6 md:p-8">
        <BookingConfirmation appointment={appointment} />
      </main>
    </div>
  )
}
