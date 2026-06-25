import { useMutation } from "@tanstack/react-query"

import { type AppointmentCreate, AppointmentsService } from "@/client"

export function useCreateAppointment() {
  return useMutation({
    mutationFn: (data: AppointmentCreate) =>
      AppointmentsService.createAppointment({ requestBody: data }),
  })
}
