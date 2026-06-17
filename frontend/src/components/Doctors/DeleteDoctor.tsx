import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { DoctorsService } from '@/client';
import type { ApiError } from '@/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LoadingButton } from '@/components/ui/loading-button';
import useCustomToast from '@/hooks/useCustomToast';
import { handleError } from '@/utils';

interface DeleteDoctorProps {
  id: string;
  onSuccess: () => void;
}

interface ConflictDetail {
  can_delete: boolean;
  availability_count: number;
  future_appointments_count: number;
  message: string;
}

const DeleteDoctor = ({ id, onSuccess }: DeleteDoctorProps) => {
  const { t } = useTranslation(['doctors', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const [conflict, setConflict] = useState<ConflictDetail | null>(null);
  const queryClient = useQueryClient();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { handleSubmit } = useForm();

  const mutation = useMutation({
    mutationFn: (force: boolean) =>
      DoctorsService.deleteDoctor({ doctorId: id, force }),
    onSuccess: () => {
      showSuccessToast(t('common:toasts.deleteSuccess'));
      setIsOpen(false);
      setConflict(null);
      onSuccess();
    },
    onError: (error) => {
      // Check if this is a 409 conflict with detail object
      const apiError = error as { status?: number; body?: ConflictDetail };
      if (apiError?.status === 409 && apiError?.body?.can_delete === false) {
        setConflict(apiError.body);
      } else {
        handleError.bind(showErrorToast)(error as ApiError);
        setIsOpen(false);
        setConflict(null);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const onSubmit = async () => {
    setConflict(null);
    mutation.mutate(false);
  };

  const onForceDelete = async () => {
    setConflict(null);
    mutation.mutate(true);
  };

  const onCancelConflict = () => {
    setConflict(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        variant="destructive"
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Trash2 />
        {t('common:actions.delete')}
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        {conflict ? (
          <form onSubmit={handleSubmit(onForceDelete)}>
            <DialogHeader>
              <DialogTitle>{t('common:confirmations.deleteTitle')}</DialogTitle>
              <DialogDescription>
                {t('delete.confirmMessage')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              {conflict.availability_count > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('delete.availabilityWarning', {
                    count: conflict.availability_count,
                  })}
                </p>
              )}
              {conflict.future_appointments_count > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('delete.appointmentsWarning', {
                    count: conflict.future_appointments_count,
                  })}
                </p>
              )}
              <p className="text-sm font-medium text-destructive">
                {t('delete.forceConfirmMessage')}
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={onCancelConflict}
              >
                {t('common:actions.cancel')}
              </Button>
              <LoadingButton
                variant="destructive"
                type="submit"
                loading={mutation.isPending}
              >
                {t('common:actions.delete')}
              </LoadingButton>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t('common:confirmations.deleteTitle')}</DialogTitle>
              <DialogDescription>
                {t('delete.confirmMessage')}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  {t('common:actions.cancel')}
                </Button>
              </DialogClose>
              <LoadingButton
                variant="destructive"
                type="submit"
                loading={mutation.isPending}
              >
                {t('common:actions.delete')}
              </LoadingButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDoctor;
