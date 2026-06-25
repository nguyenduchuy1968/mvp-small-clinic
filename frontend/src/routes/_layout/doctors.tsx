import { createFileRoute } from "@tanstack/react-router"

import { DoctorList } from "@/components/Doctors/DoctorList"

export const Route = createFileRoute("/_layout/doctors")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Doctors",
      },
    ],
  }),
})

function RouteComponent() {
  return <DoctorList />
}
