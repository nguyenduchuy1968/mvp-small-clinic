import { useQuery } from '@tanstack/react-query';

import { AvailabilityService } from '@/client';

export function useAvailability(availabilityId: string) {
  return useQuery({
    queryFn: () =>
      AvailabilityService.readDoctorAvailabilities({
        doctorId: '', // Not used for single fetch; we filter client-side
        skip: 0,
        limit: 1,
        activeOnly: false,
      }),
    queryKey: ['availability', availabilityId],
    enabled: false, // Disabled since we don't have a single-get endpoint
  });
}
