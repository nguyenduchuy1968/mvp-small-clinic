import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import { useCreateBlockedDates } from "@/hooks/useCreateBlockedDates"
import { getClinicTodayString } from "@/utils/date"

interface CreateBlockedDatesProps {
  doctorId: string
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const current = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

const CreateBlockedDates = ({ doctorId }: CreateBlockedDatesProps) => {
  const { t } = useTranslation(["blockedDates", "common"])
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const createBlockedDates = useCreateBlockedDates()

  const isPending = createBlockedDates.isPending
  const isValid = startDate && endDate && startDate <= endDate

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    const dates = getDateRange(startDate, endDate)

    createBlockedDates.mutate(
      {
        doctorId,
        requestBody: {
          dates,
          reason: reason || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsOpen(false)
          setStartDate("")
          setEndDate("")
          setReason("")
        },
      },
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setStartDate("")
          setEndDate("")
          setReason("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          {t("common:actions.create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{t("blockedDates:create.title")}</DialogTitle>
            <DialogDescription>
              {t("blockedDates:create.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">
                {t("blockedDates:fields.startDate")}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                min={getClinicTodayString()}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">
                {t("blockedDates:fields.endDate")}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">{t("blockedDates:fields.reason")}</Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("blockedDates:fields.reason")}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                {t("common:actions.cancel")}
              </Button>
            </DialogClose>
            <LoadingButton
              type="submit"
              loading={isPending}
              disabled={!isValid}
            >
              {t("common:actions.save")}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateBlockedDates
