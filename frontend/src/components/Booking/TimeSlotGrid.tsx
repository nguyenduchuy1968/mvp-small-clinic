import { useTranslation } from 'react-i18next';

import type { AvailableSlot } from '@/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TimeSlotGridProps {
  slots: AvailableSlot[] | undefined;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  isLoading: boolean;
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
  isLoading,
}: TimeSlotGridProps) {
  const { t } = useTranslation('booking');

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('noSlots')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const time = slot.time;
        // Display time in HH:MM format (backend returns "HH:MM:SS" or "HH:MM")
        const displayTime = time.length > 5 ? time.slice(0, 5) : time;

        return (
          <Button
            key={time}
            variant={selectedTime === time ? 'default' : 'outline'}
            onClick={() => onSelect(time)}
            className={cn(
              'text-sm',
              selectedTime === time && 'ring-2 ring-primary ring-offset-2',
            )}
          >
            {displayTime}
          </Button>
        );
      })}
    </div>
  );
}
