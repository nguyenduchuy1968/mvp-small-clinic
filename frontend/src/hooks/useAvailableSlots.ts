import { useQuery } from "@tanstack/react-query"

import { AppointmentsService } from "@/client"

export function useAvailableSlots(
  doctorId: string | null,
  date: string | null,
) {
  return useQuery({
    queryFn: () =>
      AppointmentsService.getAvailableSlots({
        doctorId: doctorId!,
        date: date!,
      }),
    queryKey: ["available-slots", doctorId, date],
    enabled: !!doctorId && !!date,
  })
}
