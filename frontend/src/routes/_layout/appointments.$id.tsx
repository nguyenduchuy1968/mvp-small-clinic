import { createFileRoute } from "@tanstack/react-router"
import { AppointmentDetails } from "@/components/Appointments/AppointmentDetails"

export const Route = createFileRoute("/_layout/appointments/$id")({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [
      {
        title: `Appointment - ${params.id}`,
      },
    ],
  }),
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <AppointmentDetails
      appointmentId={id}
      onBack={() => window.history.back()}
    />
  )
}
