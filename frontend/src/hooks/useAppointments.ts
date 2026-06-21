import { useQuery } from "@tanstack/react-query"

import { AppointmentsService } from "@/client"

export function useAppointments() {
  return useQuery({
    queryFn: () =>
      AppointmentsService.readAppointments({ skip: 0, limit: 100 }),
    queryKey: ["appointments"],
  })
}
