import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Weekday } from '@/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';
import { useCreateAvailability } from '@/hooks/useCreateAvailability';
import {
  AvailabilityForm,
  type AvailabilityFormData,
} from './AvailabilityForm';

interface CreateAvailabilityProps {
  doctorId: string;
}

const CreateAvailability = ({ doctorId }: CreateAvailabilityProps) => {
  const { t } = useTranslation(['availability', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const createAvailability = useCreateAvailability();

  const onSubmit = (data: AvailabilityFormData) => {
    const payload = {
      weekday: data.weekday as Weekday,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: data.duration_minutes
        ? Number(data.duration_minutes)
        : 30,
      is_active: data.is_active,
    };
    createAvailability.mutate(
      { doctorId, requestBody: payload },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          {t('common:actions.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('availability:create.title')}</DialogTitle>
          <DialogDescription>
            {t('availability:create.title')}
          </DialogDescription>
        </DialogHeader>
        <AvailabilityForm
          onSubmit={onSubmit}
          isPending={createAvailability.isPending}
        >
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={createAvailability.isPending}>
                {t('common:actions.cancel')}
              </Button>
            </DialogClose>
            <LoadingButton type="submit" loading={createAvailability.isPending}>
              {t('common:actions.save')}
            </LoadingButton>
          </DialogFooter>
        </AvailabilityForm>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAvailability;
