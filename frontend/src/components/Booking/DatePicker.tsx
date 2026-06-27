import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { getClinicTodayString } from '@/utils/date';

interface DatePickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string to a short day name (e.g., "Mon", "Tue").
 */
function getDayName(dateStr: string, locale: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(locale, { weekday: 'short' });
}

/**
 * Format a date string to day number (e.g., "15").
 */
function getDayNumber(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return String(date.getDate());
}

/**
 * Format a date string to month name (e.g., "Jan").
 */
function getMonthName(dateStr: string, locale: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(locale, { month: 'short' });
}

/**
 * Check if a date string falls on a weekend (Saturday=6, Sunday=0).
 */
function isWeekend(dateStr: string): boolean {
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
  const { t, i18n } = useTranslation('booking');

  const todayStr = getClinicTodayString();

  // Generate 14 days of date options starting from today
  const dateOptions = useMemo(() => {
    const locale =
      i18n.language === 'uk'
        ? 'uk-UA'
        : i18n.language === 'vi'
          ? 'vi-VN'
          : 'en-GB';

    return Array.from({ length: 14 }, (_, i) => {
      const dateStr = addDays(todayStr, i);
      return {
        value: dateStr,
        dayName: getDayName(dateStr, locale),
        dayNumber: getDayNumber(dateStr),
        monthName: getMonthName(dateStr, locale),
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        isWeekend: isWeekend(dateStr),
      };
    });
  }, [todayStr, i18n.language]);

  return (
    <div className="space-y-0">
      {/* Visual date cards grid */}
      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3"
        role="radiogroup"
        aria-label={t('datePicker.selectDate')}
      >
        {dateOptions.map((option) => {
          const isSelected = selectedDate === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              disabled={option.isPast}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.dayName} ${option.monthName} ${option.dayNumber}${option.isToday ? ` (${t('datePicker.today')})` : ''}`}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-4 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                // ── Selected State (Teal) ─────────────────────
                isSelected &&
                  'border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10 cursor-pointer',
                // ── Today State (Teal accent, not selected) ───
                !isSelected &&
                  option.isToday &&
                  'border-teal-300 bg-white hover:border-teal-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
                // ── Weekend State (Orange typography only) ────
                !isSelected &&
                  !option.isToday &&
                  !option.isPast &&
                  option.isWeekend &&
                  'border-gray-200 bg-white hover:border-teal-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
                // ── Default State (Gray border) ───────────────
                !isSelected &&
                  !option.isToday &&
                  !option.isPast &&
                  !option.isWeekend &&
                  'border-gray-200 bg-white hover:border-teal-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
                // ── Disabled/Past State (Gray muted) ──────────
                option.isPast &&
                  'border-gray-100 bg-gray-50 opacity-45 cursor-not-allowed hover:shadow-none hover:translate-y-0'
              )}
            >
              {/* Day name */}
              <span
                className={cn(
                  'text-[12px] font-semibold uppercase tracking-wider transition-colors duration-200',
                  isSelected && 'text-teal-600',
                  !isSelected && option.isToday && 'text-teal-500',
                  !isSelected &&
                    !option.isToday &&
                    !option.isPast &&
                    !option.isWeekend &&
                    'text-gray-500',
                  !isSelected &&
                    !option.isPast &&
                    option.isWeekend &&
                    'text-orange-500',
                  option.isPast && 'text-gray-300'
                )}
              >
                {option.dayName}
              </span>

              {/* Day number */}
              <span
                className={cn(
                  'text-[22px] sm:text-[24px] font-bold leading-none transition-colors duration-200',
                  isSelected && 'text-teal-700',
                  !isSelected && option.isToday && 'text-teal-600',
                  !isSelected &&
                    !option.isToday &&
                    !option.isPast &&
                    !option.isWeekend &&
                    'text-gray-900',
                  !isSelected &&
                    !option.isPast &&
                    option.isWeekend &&
                    'text-orange-600',
                  option.isPast && 'text-gray-300'
                )}
              >
                {option.dayNumber}
              </span>

              {/* Month */}
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors duration-200',
                  isSelected && 'text-teal-500',
                  !isSelected &&
                    !option.isPast &&
                    !option.isWeekend &&
                    'text-gray-400',
                  !isSelected &&
                    !option.isPast &&
                    option.isWeekend &&
                    'text-orange-400',
                  option.isPast && 'text-gray-300'
                )}
              >
                {option.monthName}
              </span>

              {/* Today badge — teal pill */}
              {option.isToday && !isSelected && (
                <span className="mt-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-semibold text-teal-600 shadow-sm">
                  {t('datePicker.today')}
                </span>
              )}

              {/* Selected indicator — teal dot */}
              {isSelected && (
                <span className="mt-1 flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  {t('datePicker.selected')}
                </span>
              )}

              {/* Disabled badge */}
              {option.isPast && (
                <span className="mt-1 text-[10px] font-medium text-gray-300">
                  {t('datePicker.unavailable')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
