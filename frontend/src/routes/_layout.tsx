import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { Footer } from '@/components/Common/Footer';
import { LanguageSwitcher } from '@/components/Common/LanguageSwitcher';
import AppSidebar from '@/components/Sidebar/AppSidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UsersService } from '@/client';
import type { UserPublic } from '@/client';
import { isLoggedIn } from '@/hooks/useAuth';
import { isPatient, isStaff } from '@/utils/authorization';

export const Route = createFileRoute('/_layout')({
  component: Layout,
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
      // Cache miss — prefetch once (this also populates the cache
      // for useAuth() to consume without a second API call)
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
    //    This check MUST come before the staff check because patient
    //    users have role = "doctor" in the database (the backend default).
    //    A Patient is a medical profile, not an authorization role.
    if (await isPatient()) {
      // Patient — redirect to patient dashboard
      throw redirect({
        to: '/patient/dashboard',
      });
    }

    // 4. Is this user a staff member (doctor or admin)?
    if (!isStaff(user)) {
      // Neither patient nor staff — redirect to login
      throw redirect({
        to: '/login',
      });
    }

    // 5. Staff member — allow access
  },
});

function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
          <SidebarTrigger />
          <LanguageSwitcher />
        </header>
        <main className="flex-1 bg-slate-50 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Layout;
