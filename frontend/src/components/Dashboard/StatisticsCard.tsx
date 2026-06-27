import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Stethoscope,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';

interface StatisticsCardProps {
  /** List of all appointments to derive statistics from */
  appointments?: AppointmentPublic[];
  /** Total number of doctors */
  totalDoctors?: number;
  /** Whether data is still loading */
  isLoading?: boolean;
  /** Optional className override */
  className?: string;
}

/**
 * Dashboard statistics grid showing key metrics.
 *
 * Displays four stat cards with semantic color variants:
 * - Total doctors → secondary (blue)
 * - Total appointments → primary (teal)
 * - Pending appointments → warning (orange)
 * - Today's appointments → success (green)
 *
 * Reuses the existing `StatCard` component from the UI library.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <StatisticsCard
 *   appointments={appointments}
 *   totalDoctors={doctors?.length}
 *   isLoading={isLoading}
 * />
 * ```
 */
export function StatisticsCard({
  appointments,
  totalDoctors = 0,
  isLoading,
  className,
}: StatisticsCardProps) {
  const { t } = useTranslation('dashboard');

  const totalAppointments = appointments?.length ?? 0;
  const pendingAppointments =
    appointments?.filter((a) => a.status === 'pending').length ?? 0;
  const todayAppointments =
    appointments?.filter((a) => {
      const today = new Date().toISOString().slice(0, 10);
      return a.appointment_date === today;
    }).length ?? 0;

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 gap-4 lg:grid-cols-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-8 text-center shadow-sm animate-pulse"
          >
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
            <div className="mt-1 h-4 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-4 lg:grid-cols-4', className)}>
      <StatCard
        icon={Stethoscope}
        value={String(totalDoctors)}
        label={t('stats.totalDoctors')}
        variant="secondary"
      />
      <StatCard
        icon={CalendarCheck}
        value={String(totalAppointments)}
        label={t('stats.totalAppointments')}
        variant="primary"
      />
      <StatCard
        icon={CalendarClock}
        value={String(pendingAppointments)}
        label={t('stats.pendingAppointments')}
        variant="warning"
      />
      <StatCard
        icon={CalendarX}
        value={String(todayAppointments)}
        label={t('stats.todayAppointments')}
        variant="success"
      />
    </div>
  );
}
