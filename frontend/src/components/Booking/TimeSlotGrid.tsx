import {
  AlertTriangle,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudOff,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { AvailableSlot } from '@/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDateForDisplay, getClinicTodayString } from '@/utils/date';

interface TimeSlotGridProps {
  slots: AvailableSlot[] | undefined;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  isLoading: boolean;
  reason?: string | null;
  date?: string | null;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
}

function SelectedDatePanel({
  date,
  onPreviousDay,
  onNextDay,
  isPreviousDisabled,
}: {
  date: string;
  onPreviousDay?: () => void;
  onNextDay?: () => void;
  isPreviousDisabled?: boolean;
}) {
  const { t, i18n } = useTranslation('booking');

  const dateObj = new Date(`${date}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return null;

  const dayOfWeek = dateObj.toLocaleDateString(
    i18n.language === 'uk'
      ? 'uk-UA'
      : i18n.language === 'vi'
        ? 'vi-VN'
        : 'en-GB',
    {
      weekday: 'long',
    }
  );
  const formattedDate = formatDateForDisplay(date, i18n.language);

  return (
    <Card className="shrink-0 rounded-2xl border border-gray-200 shadow-sm bg-linear-to-b from-white to-gray-50/50">
      <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="text-[15px] font-medium capitalize text-gray-500">
          {dayOfWeek}
        </span>
        <span className="text-[28px] font-bold tracking-tight text-gray-900">
          {formattedDate}
        </span>

        {/* Date navigation buttons */}
        {(onPreviousDay || onNextDay) && (
          <div className="mt-4 flex items-center gap-3">
            {onPreviousDay && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousDay}
                disabled={isPreviousDisabled}
                className="rounded-xl border-gray-300 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-teal-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('navigation.previousDay')}
              </Button>
            )}
            {onNextDay && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNextDay}
                className="rounded-xl border-gray-300 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-teal-400 transition-all"
              >
                {t('navigation.nextDay')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Modern information card for empty/no-slots states with semantic colors.
 */
function StateInfoCard({
  icon: Icon,
  title,
  description,
  variant,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  variant: 'weekend' | 'warning' | 'error' | 'info';
}) {
  const variantStyles = {
    weekend: {
      container: 'border-orange-200 bg-gradient-to-b from-orange-50 to-white',
      icon: 'text-orange-500',
      title: 'text-orange-700',
      description: 'text-orange-600',
    },
    warning: {
      container: 'border-amber-200 bg-gradient-to-b from-amber-50 to-white',
      icon: 'text-amber-500',
      title: 'text-amber-700',
      description: 'text-amber-600',
    },
    error: {
      container: 'border-red-200 bg-gradient-to-b from-red-50 to-white',
      icon: 'text-red-500',
      title: 'text-red-700',
      description: 'text-red-600',
    },
    info: {
      container: 'border-blue-200 bg-gradient-to-b from-blue-50 to-white',
      icon: 'text-blue-500',
      title: 'text-blue-700',
      description: 'text-blue-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-2xl border-2 p-8 sm:p-10 text-center shadow-sm',
        styles.container
      )}
      role="status"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon className={cn('h-7 w-7', styles.icon)} />
      </div>
      <div className="space-y-2 max-w-sm">
        <p className={cn('text-[18px] font-bold', styles.title)}>{title}</p>
        <p className={cn('text-[15px] leading-relaxed', styles.description)}>
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * Grid of time slot buttons with full keyboard navigation (listbox pattern).
 *
 * - Arrow keys move focus between slots (wraps at grid edges)
 * - Enter/Space selects the focused slot
 * - Home/End jump to first/last slot
 */
function SlotsGrid({
  slots,
  selectedTime,
  onSelect,
  t,
}: {
  slots: AvailableSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const container = gridRef.current;
      if (!container) return;

      const buttons: NodeListOf<HTMLButtonElement> = container.querySelectorAll(
        'button[role="option"]'
      );
      if (buttons.length === 0) return;

      const currentIndex = Array.from(buttons).findIndex(
        (btn: HTMLButtonElement) => btn.getAttribute('aria-selected') === 'true'
      );
      const activeIndex = currentIndex >= 0 ? currentIndex : 0;

      let nextIndex = activeIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = activeIndex < buttons.length - 1 ? activeIndex + 1 : 0;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = activeIndex > 0 ? activeIndex - 1 : buttons.length - 1;
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Move down by grid columns (assume 2 cols on mobile, 3 on sm, 4 on md)
          nextIndex = Math.min(activeIndex + 2, buttons.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = Math.max(activeIndex - 2, 0);
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = buttons.length - 1;
          break;
        default:
          return;
      }

      buttons[nextIndex]?.focus();
    },
    []
  );

  return (
    <div
      ref={gridRef}
      role="listbox"
      aria-label={t('timeSlot.available', { count: slots.length })}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      onKeyDown={handleKeyDown}
    >
      {slots.map((slot) => {
        const time = slot.time;
        // Display time in HH:MM format (backend returns "HH:MM:SS" or "HH:MM")
        const displayTime = time.length > 5 ? time.slice(0, 5) : time;
        const isSelected = selectedTime === time;

        return (
          <button
            key={time}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(time)}
            className={cn(
              'group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-5 transition-all duration-200 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
              isSelected
                ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10'
                : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-lg hover:-translate-y-0.5'
            )}
            aria-label={`${displayTime} - ${isSelected ? t('timeSlot.selected') : t('timeSlot.select')}`}
          >
            {/* Time icon */}
            <Clock
              className={cn(
                'h-5 w-5 transition-colors duration-200',
                isSelected
                  ? 'text-teal-600'
                  : 'text-gray-400 group-hover:text-teal-500'
              )}
            />

            {/* Time display */}
            <span
              className={cn(
                'text-[18px] sm:text-[20px] font-bold leading-none transition-colors duration-200',
                isSelected ? 'text-teal-700' : 'text-gray-900'
              )}
            >
              {displayTime}
            </span>

            {/* Duration hint */}
            <span
              className={cn(
                'text-[11px] font-medium transition-colors duration-200',
                isSelected ? 'text-teal-500' : 'text-gray-400'
              )}
            >
              {t('timeSlot.duration')}
            </span>

            {/* Selected indicator */}
            {isSelected && (
              <span className="mt-1 flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {t('timeSlot.selected')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
  isLoading,
  reason,
  date,
  onPreviousDay,
  onNextDay,
}: TimeSlotGridProps) {
  const { t } = useTranslation('booking');

  const isPreviousDisabled = date ? date <= getClinicTodayString() : true;

  const slotsContent = () => {
    if (isLoading) {
      return (
        <div
          className="space-y-4"
          role="status"
          aria-label={t('timeSlot.loadingAria')}
        >
          {/* Loading header */}
          <div className="flex items-center gap-2 text-[15px] text-gray-500 mb-4">
            <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
            <span>{t('timeSlot.loading')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-gray-100 bg-white p-5"
              >
                <Skeleton className="h-5 w-5 rounded-full mx-auto mb-2" />
                <Skeleton className="h-6 w-16 mx-auto mb-1" />
                <Skeleton className="h-3 w-10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!slots || slots.length === 0) {
      // ── Weekend State (Orange) ─────────────────────────────
      if (reason === 'weekend') {
        return (
          <StateInfoCard
            icon={CalendarX}
            title={t('noSlots.weekend.title')}
            description={t('noSlots.weekend.hint')}
            variant="weekend"
          />
        );
      }

      // ── Fully Booked State (Red) ───────────────────────────
      if (reason === 'fully_booked') {
        return (
          <StateInfoCard
            icon={XCircle}
            title={t('noSlots.fullyBooked.title')}
            description={t('noSlots.fullyBooked.hint')}
            variant="error"
          />
        );
      }

      // ── Doctor Unavailable State (Warning) ─────────────────
      if (reason === 'doctor_unavailable') {
        return (
          <StateInfoCard
            icon={AlertTriangle}
            title={t('noSlots.doctorUnavailable.title')}
            description={t('noSlots.doctorUnavailable.hint')}
            variant="warning"
          />
        );
      }

      // ── No Schedule State (Info) ───────────────────────────
      if (reason === 'no_schedule') {
        return (
          <StateInfoCard
            icon={CloudOff}
            title={t('noSlots.noSchedule.title')}
            description={t('noSlots.noSchedule.hint')}
            variant="info"
          />
        );
      }

      // ── Default No Slots State (Info) ──────────────────────
      return (
        <StateInfoCard
          icon={CalendarX}
          title={t('noSlots.default')}
          description={t('noSlots.defaultHint')}
          variant="info"
        />
      );
    }

    return (
      <div className="space-y-4">
        {/* Available slots header */}
        <div className="flex items-center gap-2 text-[15px] text-gray-500">
          <span className="flex h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>
            {t('timeSlot.available', {
              count: slots.length,
            })}
          </span>
        </div>

        <SlotsGrid
          slots={slots}
          selectedTime={selectedTime}
          onSelect={onSelect}
          t={t}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      {/* Time slots — takes remaining space */}
      <div className="flex-1 min-w-0">{slotsContent()}</div>

      {/* Selected date panel — right side on desktop, top on mobile */}
      {date && (
        <div className="order-first md:order-last md:min-w-50">
          <SelectedDatePanel
            date={date}
            onPreviousDay={onPreviousDay}
            onNextDay={onNextDay}
            isPreviousDisabled={isPreviousDisabled}
          />
        </div>
      )}
    </div>
  );
}
