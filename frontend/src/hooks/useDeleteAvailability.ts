import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AvailabilityService } from '@/client';
import type { ApiError } from '@/client';
import useCustomToast from '@/hooks/useCustomToast';
import { handleError } from '@/utils';

export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('availability');
  const { showSuccessToast, showErrorToast } = useCustomToast();

  return useMutation({
    mutationFn: AvailabilityService.deleteDoctorAvailability,
    onSuccess: () => {
      showSuccessToast(t('delete.success'));
    },
    onError: (err: Error) => {
      handleError.call(showErrorToast, err as unknown as ApiError);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
    },
  });
}
