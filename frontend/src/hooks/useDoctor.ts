import { useQuery } from '@tanstack/react-query';

import { DoctorsService } from '@/client';

export function useDoctor(id: string) {
  return useQuery({
    queryFn: () => DoctorsService.readDoctor({ doctorId: id }),
    queryKey: ['doctor', id],
    enabled: !!id,
  });
}
