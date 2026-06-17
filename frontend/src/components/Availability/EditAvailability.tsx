import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DoctorAvailabilityPublic, Weekday } from '@/client';
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
import { useUpdateAvailability } from '@/hooks/useUpdateAvailability';
import {
  AvailabilityForm,
  type AvailabilityFormData,
} from './AvailabilityForm';

interface EditAvailabilityProps {
  availability: DoctorAvailabilityPublic;
  onSuccess: () => void;
}

const EditAvailability = ({
  availability,
  onSuccess,
}: EditAvailabilityProps) => {
  const { t } = useTranslation(['availability', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const updateAvailability = useUpdateAvailability();

  const onSubmit = (data: AvailabilityFormData) => {
    const payload = {
      weekday: data.weekday as Weekday,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: data.duration_minutes
        ? Number(data.duration_minutes)
        : null,
      is_active: data.is_active,
    };
    updateAvailability.mutate(
      {
        availabilityId: availability.id,
        requestBody: payload,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          onSuccess();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        {t('common:actions.edit')}
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('availability:edit.title')}</DialogTitle>
          <DialogDescription>
            {t('availability:edit.title')}
          </DialogDescription>
        </DialogHeader>
        <AvailabilityForm
          onSubmit={onSubmit}
          defaultValues={{
            weekday: availability.weekday,
            start_time: availability.start_time,
            end_time: availability.end_time,
            duration_minutes: availability.duration_minutes?.toString() ?? '30',
            is_active: availability.is_active ?? true,
          }}
          isPending={updateAvailability.isPending}
        >
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={updateAvailability.isPending}
              >
                {t('common:actions.cancel')}
              </Button>
            </DialogClose>
            <LoadingButton type="submit" loading={updateAvailability.isPending}>
              {t('common:actions.save')}
            </LoadingButton>
          </DialogFooter>
        </AvailabilityForm>
      </DialogContent>
    </Dialog>
  );
};

export default EditAvailability;
