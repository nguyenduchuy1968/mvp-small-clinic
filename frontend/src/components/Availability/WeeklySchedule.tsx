import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { AvailabilityService } from '@/client';
import PendingItems from '@/components/Pending/PendingItems';
import { cn } from '@/lib/utils';
import { formatTimeHHmm } from '@/utils';

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

function getAvailabilitiesQueryOptions(doctorId: string) {
  return {
    queryFn: () =>
      AvailabilityService.readDoctorAvailabilities({
        doctorId,
        skip: 0,
        limit: 100,
        activeOnly: false,
      }),
    queryKey: ['availabilities', doctorId],
    enabled: !!doctorId,
  };
}

interface WeeklyScheduleContentProps {
  doctorId: string;
}

function WeeklyScheduleContent({ doctorId }: WeeklyScheduleContentProps) {
  const { t } = useTranslation('availability');
  const { data: availabilities } = useSuspenseQuery(
    getAvailabilitiesQueryOptions(doctorId)
  );

  const activeSlots = availabilities.data.filter((s) => s.is_active);
  const inactiveSlots = availabilities.data.filter((s) => !s.is_active);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      {WEEKDAYS.map((day) => {
        const daySlots = activeSlots.filter((s) => s.weekday === day);
        const dayInactiveSlots = inactiveSlots.filter((s) => s.weekday === day);
        const hasSlots = daySlots.length > 0 || dayInactiveSlots.length > 0;

        return (
          <div
            key={day}
            className={cn(
              'rounded-lg border p-3 min-h-30',
              hasSlots ? 'bg-card' : 'bg-muted/30'
            )}
          >
            <h3 className="font-semibold text-sm mb-2">
              {t(`weekdays.${day}`)}
            </h3>
            {daySlots.length === 0 && dayInactiveSlots.length === 0 && (
              <p className="text-xs text-muted-foreground">—</p>
            )}
            <div className="space-y-1.5">
              {daySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="text-xs bg-primary/10 text-primary rounded px-2 py-1"
                >
                  <span className="font-medium">
                    {formatTimeHHmm(slot.start_time)}–
                    {formatTimeHHmm(slot.end_time)}
                  </span>
                  {slot.duration_minutes && (
                    <span className="ml-1 opacity-70">
                      ({slot.duration_minutes}min)
                    </span>
                  )}
                </div>
              ))}
              {dayInactiveSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="text-xs bg-muted text-muted-foreground rounded px-2 py-1 line-through"
                >
                  <span className="font-medium">
                    {formatTimeHHmm(slot.start_time)}–
                    {formatTimeHHmm(slot.end_time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface WeeklyScheduleProps {
  doctorId: string;
}

export function WeeklySchedule({ doctorId }: WeeklyScheduleProps) {
  const { t } = useTranslation('availability');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('list.title')}</p>
      </div>
      <Suspense fallback={<PendingItems />}>
        <WeeklyScheduleContent doctorId={doctorId} />
      </Suspense>
    </div>
  );
}
