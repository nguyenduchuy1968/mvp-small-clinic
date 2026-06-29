import { useQuery } from '@tanstack/react-query';

import { AppointmentsService } from '@/client';

/**
 * Load all appointments for a given patient.
 *
 * Calls `GET /api/v1/patients/{patient_id}/appointments`.
 * Returns an array of `AppointmentPublic` objects sorted by the backend
 * (nearest first by default).
 *
 * ---
 * **Usage:**
 * ```tsx
 * const { data: appointments, isLoading, error } = usePatientAppointments(patientId)
 * ```
 */
export function usePatientAppointments(patientId: string | undefined) {
  return useQuery({
    queryFn: () =>
      AppointmentsService.readPatientAppointments({
        patientId: patientId!,
        skip: 0,
        limit: 100,
      }),
    queryKey: ['patient', patientId, 'appointments'],
    enabled: !!patientId,
  });
}
