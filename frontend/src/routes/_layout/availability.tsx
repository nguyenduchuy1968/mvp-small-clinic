import { createFileRoute } from '@tanstack/react-router';

import { AvailabilityList } from '@/components/Availability/AvailabilityList';
import { WeeklySchedule } from '@/components/Availability/WeeklySchedule';
import useAuth from '@/hooks/useAuth';

function AvailabilityPage() {
  const { user } = useAuth();

  // Use the current user's id as doctor_id for now
  const doctorId = user?.id ?? '';

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
