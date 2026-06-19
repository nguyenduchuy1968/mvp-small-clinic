import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { AvailabilityList } from '@/components/Availability/AvailabilityList';
import { WeeklySchedule } from '@/components/Availability/WeeklySchedule';
import { DoctorsService } from '@/client';
import useAuth from '@/hooks/useAuth';

function AvailabilityPage() {
  const { t } = useTranslation('availability');
  const { user } = useAuth();

  const isAdmin = user?.is_superuser === true;

  // Fetch all doctors and find the one linked to the current user
  const { data: doctorsData } = useQuery({
    queryFn: () => DoctorsService.readDoctors({ skip: 0, limit: 100 }),
    queryKey: ['doctors'],
    enabled: !!user?.id,
  });

  const currentDoctor = doctorsData?.data?.find(
    (doctor) => doctor.user_id === user?.id
  );
  const doctorId = currentDoctor?.id ?? '';

  // Admin users without a linked doctor profile see an informative message
  if (isAdmin && !doctorId) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="rounded-full bg-muted p-6 mb-6">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {t('admin.noDoctor.title', 'Select a doctor to manage availability.')}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t(
            'admin.noDoctor.description',
            'You are viewing the admin panel. To manage availability, please select a doctor profile first.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <AvailabilityList doctorId={doctorId} />
      <WeeklySchedule doctorId={doctorId} />
    </div>
  );
}

export const Route = createFileRoute('/_layout/availability')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Schedule',
      },
    ],
  }),
});

function RouteComponent() {
  return <AvailabilityPage />;
}
