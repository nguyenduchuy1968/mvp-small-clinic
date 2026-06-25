import { EllipsisVertical, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import type { BlockedDatePublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingButton } from "@/components/ui/loading-button"
import { useDeleteBlockedDate } from "@/hooks/useDeleteBlockedDate"

interface BlockedDateActionsMenuProps {
  blockedDate: BlockedDatePublic
}

export function BlockedDateActionsMenu({
  blockedDate,
}: BlockedDateActionsMenuProps) {
  const { t } = useTranslation(["blockedDates", "common"])
  const [open, setOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const deleteBlockedDate = useDeleteBlockedDate()
  const { handleSubmit } = useForm()

  const onSubmit = async () => {
    deleteBlockedDate.mutate(
      {
        doctorId: blockedDate.doctor_id,
        blockedDateId: blockedDate.id,
      },
      {
        onSuccess: () => {
          setIsDeleteOpen(false)
          setOpen(false)
        },
      },
    )
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => e.preventDefault()}
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 />
            {t("common:actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t("common:confirmations.deleteTitle")}</DialogTitle>
              <DialogDescription>
                {t("blockedDates:delete.confirmMessage")}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  disabled={deleteBlockedDate.isPending}
                >
                  {t("common:actions.cancel")}
                </Button>
              </DialogClose>
              <LoadingButton
                variant="destructive"
                type="submit"
                loading={deleteBlockedDate.isPending}
              >
                {t("common:actions.delete")}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
