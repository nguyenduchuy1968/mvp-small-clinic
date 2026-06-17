import { useQuery } from '@tanstack/react-query';

import { AvailabilityService } from '@/client';

export function useAvailabilities(doctorId: string) {
  return useQuery({
    queryFn: () =>
      AvailabilityService.readDoctorAvailabilities({
        doctorId,
        skip: 0,
        limit: 100,
        activeOnly: false,
      }),
    queryKey: ['availabilities', doctorId],
    enabled: !!doctorId,
  });
}
