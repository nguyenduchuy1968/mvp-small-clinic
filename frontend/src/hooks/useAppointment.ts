import { useQuery } from "@tanstack/react-query"

import { AppointmentsService } from "@/client"

export function useAppointment(appointmentId: string) {
  return useQuery({
    queryFn: () => AppointmentsService.readAppointment({ appointmentId }),
    queryKey: ["appointment", appointmentId],
    enabled: !!appointmentId,
  })
}
