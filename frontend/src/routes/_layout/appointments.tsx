import { createFileRoute } from "@tanstack/react-router"
import { AppointmentList } from "@/components/Appointments/AppointmentList"

export const Route = createFileRoute("/_layout/appointments")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Appointments",
      },
    ],
  }),
})

function RouteComponent() {
  return <AppointmentList />
}

