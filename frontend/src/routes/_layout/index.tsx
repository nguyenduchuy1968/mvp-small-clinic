import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import i18next from '@/i18n';
import useAuth from '@/hooks/useAuth';

export const Route = createFileRoute('/_layout/')({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: i18next.t('dashboard:title'),
      },
    ],
  }),
});

function Dashboard() {
  const { t } = useTranslation('dashboard');
  const { user: currentUser } = useAuth();

  return (
    <div>
      <div>
        <h1 className="text-2xl truncate max-w-sm">
          {t('welcome')}, {currentUser?.full_name || currentUser?.email} 👋
        </h1>
        <p className="text-muted-foreground">
          {t('welcomeBack')}
        </p>
      </div>
    </div>
  );
}
