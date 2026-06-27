import { useTranslation } from 'react-i18next';

import type { UserPublic } from '@/client/types.gen';
import { cn } from '@/lib/utils';

interface WelcomeSectionProps {
  /** Current authenticated user */
  user?: UserPublic | null;
  /** Optional className override */
  className?: string;
}

/**
 * Dashboard welcome section displaying a greeting and the current date.
 *
 * Shows:
 * - "Welcome back, {name}" heading
 * - "nice to see you again" subtitle
 * - Current date in long format
 *
 * Rendered inside a soft medical-gradient card with rounded-3xl.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <WelcomeSection user={user} />
 * ```
 */
export function WelcomeSection({ user, className }: WelcomeSectionProps) {
  const { t, i18n } = useTranslation('dashboard');

  const today = new Date().toLocaleDateString(
    i18n.language === 'vi'
      ? 'vi-VN'
      : i18n.language === 'uk'
        ? 'uk-UA'
        : 'en-GB',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return (
    <div
      className={cn(
        'rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-teal-50 to-white px-8 py-12 sm:px-12 sm:py-16',
        className
      )}
    >
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
        {t('welcome')}
        {user?.full_name ? `, ${user.full_name}` : ''}
      </h1>
      <p className="mt-3 text-xl text-gray-500">{t('welcomeBack')}</p>
      <p className="mt-2 text-lg text-gray-400">{today}</p>
    </div>
  );
}
