import type { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { CalendarCheck, Clock, Home, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { UserPublic } from '@/client';
import { UsersService } from '@/client';
import { AppShell } from '@/components/AppShell';
import type { Item } from '@/components/Sidebar/Main';
import { isLoggedIn } from '@/hooks/useAuth';
import { isPatient, isStaff } from '@/utils/authorization';

export const Route = createFileRoute('/_patientLayout')({
  component: PatientLayout,
  beforeLoad: async (ctx) => {
    const context = ctx.context as { queryClient: QueryClient };

    // 1. Authentication check
    if (!isLoggedIn()) {
      throw redirect({
        to: '/login',
      });
    }

    // 2. Authorization check — read from React Query cache first
    const queryClient: QueryClient = context.queryClient;
    let user = queryClient.getQueryData<UserPublic>(['currentUser']);

    if (!user) {
      // Cache miss — prefetch once
      try {
        user = await queryClient.fetchQuery({
          queryKey: ['currentUser'],
          queryFn: UsersService.readUserMe,
        });
      } catch {
        throw redirect({ to: '/login' });
      }
    }

    // 3. Is this user a patient (has linked Patient profile)?
    if (!(await isPatient())) {
      // Not a patient — check if they're staff
      if (isStaff(user)) {
        throw redirect({
          to: '/dashboard',
        });
      }
      // Neither patient nor staff — redirect to login
      throw redirect({
        to: '/login',
      });
    }

    // 4. Patient — allow access
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
