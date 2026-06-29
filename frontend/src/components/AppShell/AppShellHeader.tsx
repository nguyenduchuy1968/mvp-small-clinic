import { Appearance } from '@/components/Common/Appearance';
import { LanguageSwitcher } from '@/components/Common/LanguageSwitcher';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppShellUserMenu } from './AppShellUserMenu';
import type { BreadcrumbItem } from './AppShell';

interface AppShellHeaderProps {
  pageTitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function AppShellHeader({
  pageTitle,
  breadcrumbs,
}: AppShellHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden flex-col sm:flex">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.label} className="flex items-center gap-1.5">
                  {index > 0 && <span>/</span>}
                  <span>{crumb.label}</span>
                </span>
              ))}
            </nav>
          )}
          {pageTitle && (
            <h1 className="text-lg font-semibold leading-tight">
              {pageTitle}
            </h1>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Appearance />
        <LanguageSwitcher />
        <AppShellUserMenu />
      </div>
    </header>
  );
}
