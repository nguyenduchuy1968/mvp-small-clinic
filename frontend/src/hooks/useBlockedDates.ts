import { useQuery } from '@tanstack/react-query';

import { BlockedDatesService } from '@/client';

export function useBlockedDates(doctorId: string) {
  return useQuery({
    queryFn: () =>
      BlockedDatesService.readBlockedDates({
        doctorId,
        skip: 0,
        limit: 100,
      }),
    queryKey: ['blocked-dates', doctorId],
    enabled: !!doctorId,
  });
}
