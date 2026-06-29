import { ArrowRight, CalendarCheck, CalendarPlus, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';

import { CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickAction {
  /** Icon component from lucide-react */
  icon: typeof CalendarPlus;
  /** i18n key for the title (under dashboard.quickActions) */
  titleKey: string;
  /** i18n key for the description (under dashboard.quickActions) */
  descKey: string;
  /** Route to navigate to */
  to: string;
  /** Color variant for the icon background */
  color: 'teal' | 'blue' | 'purple';
}

const actions: QuickAction[] = [
  {
    icon: CalendarPlus,
    titleKey: 'bookAppointment',
    descKey: 'bookAppointmentDesc',
    to: '/booking',
    color: 'teal',
  },
  {
    icon: CalendarCheck,
    titleKey: 'myAppointments',
    descKey: 'myAppointmentsDesc',
    to: '/patient/appointments',
    color: 'blue',
  },
  {
    icon: User,
    titleKey: 'myProfile',
    descKey: 'myProfileDesc',
    to: '/patient/profile',
    color: 'purple',
  },
];

const colorMap: Record<
  QuickAction['color'],
  { bg: string; icon: string; hover: string }
> = {
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'text-teal-600 dark:text-teal-400',
    hover: 'hover:border-teal-200 dark:hover:border-teal-800',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:border-blue-200 dark:hover:border-blue-800',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:border-purple-200 dark:hover:border-purple-800',
  },
};

interface PatientDashboardQuickActionsProps {
  /** Optional className override */
  className?: string;
}

/**
 * Quick Actions section for the Patient Dashboard.
 *
 * Displays three action cards: Book Appointment, My Appointments, My Profile.
 * Each card navigates to the corresponding route on click.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <PatientDashboardQuickActions />
 * ```
 */
export function PatientDashboardQuickActions({
  className,
}: PatientDashboardQuickActionsProps) {
  const { t } = useTranslation('patient');
  const navigate = useNavigate();

  return (
    <section
      className={cn('space-y-4', className)}
      aria-label={t('dashboard.quickActions.ariaLabel')}
    >
      <CardTitle className="text-lg font-semibold text-card-foreground">
        {t('dashboard.quickActions.title')}
      </CardTitle>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const colors = colorMap[action.color];

          return (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate({ to: action.to })}
              className={cn(
                'group flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                colors.hover
              )}
              aria-label={t(`dashboard.quickActions.${action.titleKey}`)}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  colors.bg
                )}
                aria-hidden="true"
              >
                <Icon className={cn('h-6 w-6', colors.icon)} />
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-card-foreground">
                  {t(`dashboard.quickActions.${action.titleKey}`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`dashboard.quickActions.${action.descKey}`)}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight
                className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-teal-500"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
