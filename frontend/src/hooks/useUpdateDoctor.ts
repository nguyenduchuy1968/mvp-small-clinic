import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { DoctorsService } from '@/client';
import useCustomToast from '@/hooks/useCustomToast';
import { handleError } from '@/utils';

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('doctors');
  const { showSuccessToast, showErrorToast } = useCustomToast();

  return useMutation({
    mutationFn: DoctorsService.updateDoctor,
    onSuccess: () => {
      showSuccessToast(t('edit.success'));
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}
