import { useNavigate } from '@tanstack/react-router';
import { CalendarPlus, ClipboardList, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface QuickActionsWidgetProps {
  /** Optional className override */
  className?: string;
}

/**
 * Dashboard widget displaying quick-action cards for common tasks.
 *
 * Provides three actions:
 * - **Book appointment** → `/booking`
 * - **View schedule** → `/appointments`
 * - **Manage doctors** → `/doctors`
 *
 * Each action is rendered as a clickable card with icon, title, and description.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <QuickActionsWidget />
 * ```
 */
export function QuickActionsWidget({ className }: QuickActionsWidgetProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const actions = [
    {
      icon: CalendarPlus,
      label: t('quickActions.bookAppointment'),
      description: 'Schedule a new appointment with a doctor',
      onClick: () => navigate({ to: '/booking' }),
    },
    {
      icon: ClipboardList,
      label: t('quickActions.viewSchedule'),
      description: 'View and manage your appointments',
      onClick: () => navigate({ to: '/appointments' }),
    },
    {
      icon: Stethoscope,
      label: t('quickActions.manageDoctors'),
      description: 'Browse our team of doctors',
      onClick: () => navigate({ to: '/doctors' }),
    },
  ];

  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-[19px] font-bold text-gray-900">
        {t('quickActions.title')}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-md sm:p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-[15px] font-bold text-gray-900">
                {action.label}
              </h3>
              <p className="mt-1 text-[13px] text-gray-500 leading-relaxed">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
