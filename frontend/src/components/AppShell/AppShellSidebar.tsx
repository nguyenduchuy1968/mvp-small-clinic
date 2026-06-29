import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Logo } from "@/components/Common/Logo"
import { SidebarAppearance } from "@/components/Common/Appearance"
import { Main, type Item } from "@/components/Sidebar/Main"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface AppShellSidebarProps {
  items: Item[]
}

export function AppShellSidebar({ items }: AppShellSidebarProps) {
  const { t } = useTranslation("common")
  const { user, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleLogout = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
    logout()
  }

  const displayName = user?.full_name ?? user?.email ?? "User"
  const displayEmail = user?.email ?? ""

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo variant="responsive" />
      </SidebarHeader>

      {/* User Identity Block */}
      {user && (
        <div className="flex flex-col items-center gap-2.5 px-4 pb-5 group-data-[collapsible=icon]:hidden">
          <Avatar className="size-12">
            <AvatarFallback className="text-base">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-base font-semibold">{displayName}</p>
            {displayEmail && (
              <p className="text-sm text-sidebar-foreground/60">
                {displayEmail}
              </p>
            )}
          </div>
        </div>
      )}

      <SidebarContent>
        <Main items={items} />

        <SidebarMenu>
          <SidebarAppearance />
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("nav.logout")} onClick={handleLogout}>
              <LogOut />
              <span>{t("nav.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
