import type { ReactNode } from "react"

import { Footer } from "@/components/Common/Footer"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppShellHeader } from "./AppShellHeader"
import { AppShellSidebar } from "./AppShellSidebar"
import type { Item } from "@/components/Sidebar/Main"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppShellProps {
  sidebarItems: Item[]
  pageTitle?: string
  breadcrumbs?: BreadcrumbItem[]
  children?: ReactNode
}

export function AppShell({
  sidebarItems,
  pageTitle,
  breadcrumbs,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellSidebar items={sidebarItems} />
      <SidebarInset>
        <AppShellHeader
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
        />
        <main className="flex-1 bg-slate-50 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
