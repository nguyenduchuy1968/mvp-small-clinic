import { useMutation } from '@tanstack/react-query';

import { AppointmentsService, type AppointmentCreate } from '@/client';

export function useCreateAppointment() {
  return useMutation({
    mutationFn: (data: AppointmentCreate) =>
      AppointmentsService.createAppointment({ requestBody: data }),
  });
}
