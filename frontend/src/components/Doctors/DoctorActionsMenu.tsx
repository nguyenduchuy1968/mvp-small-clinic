import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { DoctorPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAuth from "@/hooks/useAuth"
import DeleteDoctor from "./DeleteDoctor"
import EditDoctor from "./EditDoctor"

interface DoctorActionsMenuProps {
  doctor: DoctorPublic
}

export const DoctorActionsMenu = ({ doctor }: DoctorActionsMenuProps) => {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const canManageDoctors = user?.is_superuser === true

  if (!canManageDoctors) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditDoctor doctor={doctor} onSuccess={() => setOpen(false)} />
        <DeleteDoctor id={doctor.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
