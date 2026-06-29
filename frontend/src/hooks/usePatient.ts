import { useQuery } from '@tanstack/react-query';

import { AppointmentsService } from '@/client';

/**
 * Load the current patient profile linked to the authenticated user.
 *
 * Calls `GET /api/v1/patients/me` which returns the Patient record
 * (or null if the user has no linked Patient record).
 *
 * ---
 * **Usage:**
 * ```tsx
 * const { data: patient, isLoading, error } = usePatient()
 * ```
 */
export function usePatient() {
  return useQuery({
    queryFn: () => AppointmentsService.readMyPatient(),
    queryKey: ['patient', 'me'],
  });
}
