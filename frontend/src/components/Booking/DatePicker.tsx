import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
  const { t } = useTranslation('booking');

  const today = new Date();
  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(addDays(today, 1));
  const nextWeekStr = formatDate(addDays(today, 7));

  const quickOptions = [
    { label: t('datePicker.today'), value: todayStr },
    { label: t('datePicker.tomorrow'), value: tomorrowStr },
    { label: t('datePicker.nextWeek'), value: nextWeekStr },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {quickOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedDate === option.value ? 'default' : 'outline'}
            onClick={() => onSelect(option.value)}
            className="flex-1 sm:flex-none"
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="relative">
        <input
          type="date"
          value={selectedDate ?? ''}
          min={todayStr}
          onChange={(e) => onSelect(e.target.value)}
          className={cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
      </div>
    </div>
  );
}
