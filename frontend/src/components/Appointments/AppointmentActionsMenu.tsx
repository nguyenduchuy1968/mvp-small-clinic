import { EllipsisVertical } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { AppointmentPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AppointmentActionsMenuProps {
  appointment: AppointmentPublic
}

export const AppointmentActionsMenu = ({
  appointment: _appointment,
}: AppointmentActionsMenuProps) => {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation("appointments")

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>{t("actions.viewDetails")}</DropdownMenuItem>
        {/* TODO: Enable in Sprint 6.2 — navigate to /appointments/$id */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
