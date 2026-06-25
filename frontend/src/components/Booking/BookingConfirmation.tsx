import { AlertTriangle, CheckCircle2, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { formatDateLong } from "@/utils/date"

/**
 * Minimal appointment data returned by the public confirmation endpoint.
 * This is a subset of AppointmentPublic — only fields the confirmation
 * page actually needs. No PII beyond patient_email is exposed.
 */
/**
 * Minimal appointment data returned by the public confirmation endpoint.
 * All fields are readonly to accept both the full AppointmentPublic from
 * the create mutation and the trimmed response from the public endpoint.
 */
export interface AppointmentConfirmationData {
  readonly id: string
  readonly doctor_name?: string | null
  readonly appointment_date: string
  readonly appointment_time: string
  readonly booking_number?: string | null
  readonly patient_email?: string | null
  readonly status?: string
}

interface BookingConfirmationProps {
  appointment: AppointmentConfirmationData
  onNewBooking?: () => void
}

function formatTime(time: string): string {
  return time.length > 5 ? time.slice(0, 5) : time
}

export function BookingConfirmation({
  appointment,
  onNewBooking,
}: BookingConfirmationProps) {
  const { t, i18n } = useTranslation("booking")
  const [, copy] = useCopyToClipboard()

  const handleCopyBookingNumber = async () => {
    if (!appointment.booking_number) return
    const ok = await copy(appointment.booking_number)
    if (ok) {
      toast.success(t("confirmation.copySuccess"))
    } else {
      toast.error(t("common:states.error", "An error occurred"))
    }
  }

  const handleNewBooking = () => {
    onNewBooking?.()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Section 1: Success Card */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            <CardTitle className="text-xl text-green-700 dark:text-green-300">
              {t("confirmation.title")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-green-600 dark:text-green-400">
            {t("confirmation.successMessage")}
          </p>

          {/* Appointment details */}
          <div className="rounded-lg border bg-background p-4">
            <dl className="space-y-3 text-sm">
              {/* Doctor */}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("confirmation.doctor")}
                </dt>
                <dd className="font-medium text-right max-w-[60%]">
                  {appointment.doctor_name ?? "—"}
                </dd>
              </div>
              {/* Date */}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("confirmation.date")}
                </dt>
                <dd className="font-medium">
                  {formatDateLong(appointment.appointment_date, i18n.language)}
                </dd>
              </div>
              {/* Time */}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("confirmation.time")}
                </dt>
                <dd className="font-medium">
                  {formatTime(appointment.appointment_time)}
                </dd>
              </div>
              {/* Divider */}
              <hr className="border-t" />
              {/* Booking Number — visually dominant with copy button */}
              <div className="flex justify-between items-center pt-1">
                <dt className="text-sm font-semibold text-muted-foreground">
                  {t("confirmation.bookingReference")}
                </dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-primary tracking-wider">
                    {appointment.booking_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyBookingNumber}
                    title={t("confirmation.copyTooltip")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Attention Message */}
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("confirmation.attentionTitle")}</AlertTitle>
        <AlertDescription>
          <p>{t("confirmation.attentionMessage")}</p>
          <p className="font-medium text-foreground mt-1">
            {appointment.patient_email}
          </p>
          <p className="whitespace-pre-line mt-1">
            {t("confirmation.attentionMessageEmail")}
          </p>
        </AlertDescription>
      </Alert>

      {/* Section 3: Return Button */}
      <div className="flex justify-center">
        <Button
          variant="default"
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleNewBooking}
        >
          {t("confirmation.newBooking")}
        </Button>
      </div>
    </div>
  )
}
