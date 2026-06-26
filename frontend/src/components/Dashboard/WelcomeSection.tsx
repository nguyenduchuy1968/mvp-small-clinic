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
 * ---
 * **Usage:**
 * ```tsx
 * <WelcomeSection user={user} />
 * ```
 */
export function WelcomeSection({ user, className }: WelcomeSectionProps) {
  const { t, i18n } = useTranslation('dashboard');

  const today = new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'uk' ? 'uk-UA' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={cn('space-y-1', className)}>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t('welcome')}
        {user?.full_name ? `, ${user.full_name}` : ''}
      </h1>
      <p className="text-[15px] text-gray-500 sm:text-[17px]">
        {t('welcomeBack')}
      </p>
      <p className="text-[13px] text-gray-400 sm:text-[14px]">{today}</p>
    </div>
  );
}
