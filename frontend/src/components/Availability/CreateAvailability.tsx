import { CalendarDays, Plus } from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { Weekday } from "@/client"
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
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCreateAvailability } from "@/hooks/useCreateAvailability"
import { useCreateAvailabilityBulk } from "@/hooks/useCreateAvailabilityBulk"
import { AvailabilityForm, type AvailabilityFormData } from "./AvailabilityForm"

interface CreateAvailabilityProps {
  doctorId: string
}

const CreateAvailability = ({ doctorId }: CreateAvailabilityProps) => {
  const { t } = useTranslation(["availability", "common"])
  const [isOpen, setIsOpen] = useState(false)
  const createAvailability = useCreateAvailability()
  const createBulk = useCreateAvailabilityBulk()
  const formRef = useRef<HTMLFormElement>(null)

  const buildPayload = (data: AvailabilityFormData, weekday: Weekday) => ({
    weekday,
    start_time: data.start_time,
    end_time: data.end_time,
    duration_minutes: data.duration_minutes
      ? Number(data.duration_minutes)
      : 30,
    is_active: data.is_active,
  })

  const onSubmit = (data: AvailabilityFormData) => {
    createAvailability.mutate(
      { doctorId, requestBody: buildPayload(data, data.weekday as Weekday) },
      {
        onSuccess: () => {
          setIsOpen(false)
        },
      },
    )
  }

  const onApplyMonFri = () => {
    // Get current form values from the form's internal state
    const form = formRef.current
    if (!form) return

    const formData = new FormData(form)
    const start_time = formData.get("start_time") as string
    const end_time = formData.get("end_time") as string
    const duration_minutes = Number(
      (formData.get("duration_minutes") as string) || "30",
    )
    const is_active = formData.get("is_active") === "on"

    if (!start_time || !end_time) return

    createBulk.mutate(
      {
        doctorId,
        start_time,
        end_time,
        duration_minutes,
        is_active,
      },
      {
        onSuccess: () => {
          setIsOpen(false)
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          {t("common:actions.create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("availability:create.title")}</DialogTitle>
          <DialogDescription>
            {t("availability:create.title")}
          </DialogDescription>
        </DialogHeader>
        <AvailabilityForm
          onSubmit={onSubmit}
          isPending={createAvailability.isPending || createBulk.isPending}
          ref={formRef}
        >
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-sm text-muted-foreground">
              {t("availability:templates.monFri.confirm")}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit gap-2"
                  disabled={createBulk.isPending}
                  onClick={onApplyMonFri}
                >
                  <CalendarDays className="size-4" />
                  {t("availability:templates.monFri.action")}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("availability:templates.monFri.confirm")}
              </TooltipContent>
            </Tooltip>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={createAvailability.isPending || createBulk.isPending}
              >
                {t("common:actions.cancel")}
              </Button>
            </DialogClose>
            <LoadingButton
              type="submit"
              loading={createAvailability.isPending || createBulk.isPending}
            >
              {t("common:actions.save")}
            </LoadingButton>
          </DialogFooter>
        </AvailabilityForm>
      </DialogContent>
    </Dialog>
  )
}

export default CreateAvailability
