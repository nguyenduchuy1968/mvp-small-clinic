import { Calendar, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Time-of-day greeting helper.
 * Returns the i18n key suffix based on the current hour.
 */
function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

interface PatientDashboardWelcomeProps {
  /** Patient's full name (placeholder for now) */
  patientName?: string;
  /** Optional className override */
  className?: string;
}

/**
 * Welcome card displayed at the top of the Patient Dashboard.
 *
 * Shows a time-of-day greeting, the patient's name, and a subtitle.
 * Uses a gradient background with a decorative medical icon.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <PatientDashboardWelcome patientName="Nguyen Van A" />
 * ```
 */
export function PatientDashboardWelcome({
  patientName = 'Patient',
  className,
}: PatientDashboardWelcomeProps) {
  const { t } = useTranslation('patient');

  const greetingKey = getGreetingKey();
  const greeting = t(`dashboard.welcome.${greetingKey}`);
  const subtitle = t('dashboard.welcome.subtitle');
  const badgeLabel = t('dashboard.welcome.badge');
  const ariaLabel = t('dashboard.welcome.ariaLabel');

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 shadow-lg',
        className
      )}
      aria-label={ariaLabel}
    >
      {/* Decorative background elements */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 opacity-10"
        aria-hidden="true"
      >
        <HeartPulse className="h-48 w-48 text-white" />
      </div>
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 opacity-5"
        aria-hidden="true"
      >
        <Calendar className="h-32 w-32 text-white" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        {/* Avatar */}
        <div className="flex shrink-0 items-center justify-center">
          <Avatar
            size="xl"
            className="h-20 w-20 border-2 border-white/30 shadow-md sm:h-24 sm:w-24"
            aria-hidden="true"
          />
        </div>

        {/* Text content */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {greeting}
              {patientName && (
                <span className="ml-2 text-white/90">{patientName}!</span>
              )}
            </h1>
            <Badge
              variant="outline"
              className="border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
            >
              {badgeLabel}
            </Badge>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-white/80">
            {subtitle}
          </p>
        </div>
      </div>
    </Card>
  );
}
