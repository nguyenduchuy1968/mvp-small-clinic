import { useTranslation } from "react-i18next"

import type { AvailableSlot } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDateForDisplay } from "@/utils/date"

interface TimeSlotGridProps {
  slots: AvailableSlot[] | undefined
  selectedTime: string | null
  onSelect: (time: string) => void
  isLoading: boolean
  reason?: string | null
  date?: string | null
}

function SelectedDatePanel({ date }: { date: string }) {
  const { i18n } = useTranslation()

  const dateObj = new Date(`${date}T00:00:00`)
  if (Number.isNaN(dateObj.getTime())) return null

  const dayOfWeek = dateObj.toLocaleDateString(
    i18n.language === "uk"
      ? "uk-UA"
      : i18n.language === "vi"
        ? "vi-VN"
        : "en-GB",
    {
      weekday: "long",
    },
  )
  const formattedDate = formatDateForDisplay(date, i18n.language)

  return (
    <Card className="shrink-0">
      <CardContent className="flex flex-col items-center justify-center gap-1 p-4 text-center">
        <span className="text-sm font-medium capitalize text-muted-foreground">
          {dayOfWeek}
        </span>
        <span className="text-2xl font-bold tracking-tight">
          {formattedDate}
        </span>
      </CardContent>
    </Card>
  )
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
  isLoading,
  reason,
  date,
}: TimeSlotGridProps) {
  const { t } = useTranslation("booking")

  const slotsContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      )
    }

    if (!slots || slots.length === 0) {
      return (
        <div className="py-8 text-center">
          {reason === "weekend" && (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                {t("noSlots.weekend.title")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("noSlots.weekend.hint")}
              </p>
            </>
          )}
          {reason === "no_schedule" && (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                {t("noSlots.noSchedule.title")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("noSlots.noSchedule.hint")}
              </p>
            </>
          )}
          {reason === "doctor_unavailable" && (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                {t("noSlots.doctorUnavailable.title")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("noSlots.doctorUnavailable.hint")}
              </p>
            </>
          )}
          {reason === "fully_booked" && (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                {t("noSlots.fullyBooked.title")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("noSlots.fullyBooked.hint")}
              </p>
            </>
          )}
          {(!reason || reason === "") && (
            <p className="text-sm text-muted-foreground">
              {t("noSlots.default")}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {slots.map((slot) => {
          const time = slot.time
          // Display time in HH:MM format (backend returns "HH:MM:SS" or "HH:MM")
          const displayTime = time.length > 5 ? time.slice(0, 5) : time

          return (
            <Button
              key={time}
              variant={selectedTime === time ? "default" : "outline"}
              onClick={() => onSelect(time)}
              className={cn(
                "text-sm",
                selectedTime === time && "ring-2 ring-primary ring-offset-2",
              )}
            >
              {displayTime}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      {/* Time slots — takes remaining space */}
      <div className="flex-1">{slotsContent()}</div>

      {/* Selected date panel — right side on desktop, top on mobile */}
      {date && (
        <div className="order-first md:order-last">
          <SelectedDatePanel date={date} />
        </div>
      )}
    </div>
  )
}
