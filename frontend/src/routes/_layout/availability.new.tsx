import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { Weekday } from '@/client';
import useAuth from '@/hooks/useAuth';
import { useCreateAvailability } from '@/hooks/useCreateAvailability';
import {
  AvailabilityForm,
  type AvailabilityFormData,
} from '@/components/Availability/AvailabilityForm';

function NewAvailabilityPage() {
  const { t } = useTranslation(['availability', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();
  const createAvailability = useCreateAvailability();

  const doctorId = user?.id ?? '';

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
          navigate({ to: '/availability' });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('availability:create.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('availability:create.title')}
        </p>
      </div>
      <AvailabilityForm
        onSubmit={onSubmit}
        isPending={createAvailability.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute('/_layout/availability/new')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'New Schedule',
      },
    ],
  }),
});

function RouteComponent() {
  return <NewAvailabilityPage />;
}
