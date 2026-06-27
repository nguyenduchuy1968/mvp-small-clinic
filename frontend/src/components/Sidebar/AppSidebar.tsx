import { Link as RouterLink } from '@tanstack/react-router';
import {
  Ban,
  CalendarCheck,
  CalendarClock,
  Home,
  LogOut,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SidebarAppearance } from '@/components/Common/Appearance';
import { Logo } from '@/components/Common/Logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import useAuth from '@/hooks/useAuth';
import { getInitials } from '@/utils';
import { type Item, Main } from './Main';

function AppSidebar() {
  const { t } = useTranslation('common');
  const { user: currentUser, logout } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const baseItems: Item[] = [
    { icon: Home, title: t('nav.dashboard'), path: '/dashboard' },
    {
      icon: CalendarCheck,
      title: t('nav.appointments'),
      path: '/appointments',
    },
    { icon: Stethoscope, title: t('nav.doctors'), path: '/doctors' },
    {
      icon: CalendarClock,
      title: t('nav.availability'),
      path: '/availability',
    },
    {
      icon: Ban,
      title: t('nav.blockedDates'),
      path: '/blocked-dates',
    },
  ];

  const items = currentUser?.is_superuser
    ? [...baseItems, { icon: Users, title: t('nav.admin'), path: '/admin' }]
    : baseItems;

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    logout();
  };

  return (
    <Sidebar collapsible="icon">
      {/* ── Sidebar Header ─────────────────────────────────────── */}
      <SidebarHeader className="px-4 pt-5 pb-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-3 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>

      {/* ── Identity Block ─────────────────────────────────────── */}
      {currentUser && (
        <div className="flex flex-col items-center gap-2.5 px-4 pb-5 group-data-[collapsible=icon]:hidden">
          <Avatar className="size-12 ring-2 ring-sidebar-ring/20 ring-offset-1 ring-offset-sidebar">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-base font-semibold">
              {getInitials(
                currentUser.full_name ||
                  (currentUser.is_superuser ? 'Admin' : 'Dr.')
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center text-center min-w-0">
            <p className="text-base font-semibold truncate w-full text-sidebar-foreground">
              {currentUser.full_name}
            </p>
            <p className="text-sm text-sidebar-foreground/60 truncate w-full">
              {currentUser.email}
            </p>
          </div>
        </div>
      )}

      {/* ── Sidebar Content ────────────────────────────────────── */}
      <SidebarContent>
        <Main items={items} />

        <Separator className="mx-3 w-auto" />

        <SidebarMenu>
          <SidebarAppearance />
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('nav.settings')} asChild>
              <RouterLink to="/settings" onClick={handleMenuClick}>
                <Settings />
                <span>{t('nav.settings')}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('nav.logout')} onClick={handleLogout}>
              <LogOut />
              <span>{t('nav.logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
