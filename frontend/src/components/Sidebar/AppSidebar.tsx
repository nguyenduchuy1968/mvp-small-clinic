import { Link as RouterLink } from "@tanstack/react-router"
import {
  CalendarCheck,
  CalendarClock,
  Home,
  LogOut,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Separator } from "@/components/ui/separator"
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
import { type Item, Main } from "./Main"

function AppSidebar() {
  const { t } = useTranslation("common")
  const { user: currentUser, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  const baseItems: Item[] = [
    { icon: Home, title: t("nav.dashboard"), path: "/" },
    {
      icon: CalendarCheck,
      title: t("nav.appointments"),
      path: "/appointments",
    },
    { icon: Stethoscope, title: t("nav.doctors"), path: "/doctors" },
    {
      icon: CalendarClock,
      title: t("nav.availability"),
      path: "/availability",
    },
  ]

  const items = currentUser?.is_superuser
    ? [...baseItems, { icon: Users, title: t("nav.admin"), path: "/admin" }]
    : baseItems

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleLogout = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
    logout()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />

        <Separator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarAppearance />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("nav.settings")} asChild>
              <RouterLink to="/settings" onClick={handleMenuClick}>
                <Settings />
                <span>{t("nav.settings")}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
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

export default AppSidebar
