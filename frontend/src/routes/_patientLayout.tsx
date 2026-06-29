import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { CalendarCheck, Clock, Home, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/AppShell';
import type { Item } from '@/components/Sidebar/Main';
import { isLoggedIn } from '@/hooks/useAuth';

export const Route = createFileRoute('/_patientLayout')({
  component: PatientLayout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: '/login',
      });
    }
  },
});

function PatientLayout() {
  const { t } = useTranslation('patient');

  const patientNavItems: Item[] = [
    {
      icon: Home,
      title: t('nav.dashboard'),
      path: '/patient/dashboard',
    },
    {
      icon: CalendarCheck,
      title: t('nav.myAppointments'),
      path: '/patient/appointments',
    },
    {
      icon: Clock,
      title: t('nav.history'),
      path: '/patient/history',
    },
    {
      icon: User,
      title: t('nav.profile'),
      path: '/patient/profile',
    },
  ];

  return (
    <AppShell sidebarItems={patientNavItems}>
      <Outlet />
    </AppShell>
  );
}

export default PatientLayout;
