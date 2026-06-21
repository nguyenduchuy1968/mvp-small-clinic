import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type {
  AppointmentCreate,
  AppointmentPublic,
  DoctorPublic,
} from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingButton } from "@/components/ui/loading-button"
import { useAvailableSlots } from "@/hooks/useAvailableSlots"
import { useCreateAppointment } from "@/hooks/useCreateAppointment"
import { useDoctorsPublic } from "@/hooks/useDoctorsPublic"

import { DatePicker } from "./DatePicker"
import { DoctorCard } from "./DoctorCard"
import { PatientInfoForm } from "./PatientInfoForm"
import { StepIndicator } from "./StepIndicator"
import { TimeSlotGrid } from "./TimeSlotGrid"

interface BookingState {
  doctor: DoctorPublic | null
  date: string | null
  time: string | null
}

interface BookingWizardProps {
  onConfirmed: (appointment: AppointmentPublic) => void
  onSlotAlreadyBooked: () => void
}

export function BookingWizard({
  onConfirmed,
  onSlotAlreadyBooked,
}: BookingWizardProps) {
  const { t } = useTranslation("booking")
  const [step, setStep] = useState(1)
  const [bookingState, setBookingState] = useState<BookingState>({
    doctor: null,
    date: null,
    time: null,
  })

  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctorsPublic()
  const { data: slotsData, isLoading: isLoadingSlots } = useAvailableSlots(
    bookingState.doctor?.id ?? null,
    bookingState.date,
  )
  const createAppointment = useCreateAppointment()

  const steps = [
    { label: t("steps.selectDoctor") },
    { label: t("steps.selectDate") },
    { label: t("steps.selectTime") },
    { label: t("steps.patientInfo") },
    { label: t("steps.confirm") },
  ]

  const handleDoctorSelect = (doctor: DoctorPublic) => {
    setBookingState((prev) => ({ ...prev, doctor, date: null, time: null }))
    setStep(2)
  }

  const handleDateSelect = (date: string) => {
    setBookingState((prev) => ({ ...prev, date, time: null }))
    setStep(3)
  }

  const handleTimeSelect = (time: string) => {
    setBookingState((prev) => ({ ...prev, time }))
    setStep(4)
  }

  const handlePatientInfoSubmit = (data: AppointmentCreate) => {
    if (!bookingState.doctor || !bookingState.date || !bookingState.time) {
      return
    }

    const appointmentData: AppointmentCreate = {
      ...data,
      doctor_id: bookingState.doctor.id,
      appointment_date: bookingState.date,
      appointment_time: bookingState.time,
    }

    createAppointment.mutate(appointmentData, {
      onSuccess: (appointment) => {
        setStep(5)
        onConfirmed(appointment)
      },
      onError: (err) => {
        const errDetail = (err as any)?.body?.detail
        const status = (err as any)?.status
        if (errDetail === "Appointment slot already booked" || status === 409) {
          onSlotAlreadyBooked()
          setStep(3)
        } else {
          const errorMessage =
            typeof errDetail === "string"
              ? errDetail
              : errDetail?.[0]?.msg ||
                t("common:states.error", "An error occurred")
          toast.error(errorMessage)
        }
      },
    })
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1)
    }
  }

  const handleReset = () => {
    setStep(1)
    setBookingState({ doctor: null, date: null, time: null })
    createAppointment.reset()
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            {isLoadingDoctors ? (
              <p className="text-center text-muted-foreground">
                {t("common:states.loading", "Loading...")}
              </p>
            ) : !doctorsData || doctorsData.data.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {t("noDoctors")}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {doctorsData.data.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    selected={bookingState.doctor?.id === doctor.id}
                    onSelect={() => handleDoctorSelect(doctor)}
                  />
                ))}
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <DatePicker
            selectedDate={bookingState.date}
            onSelect={handleDateSelect}
          />
        )

      case 3:
        return (
          <TimeSlotGrid
            slots={slotsData?.slots}
            selectedTime={bookingState.time}
            onSelect={handleTimeSelect}
            isLoading={isLoadingSlots}
            reason={slotsData?.reason}
            date={bookingState.date}
          />
        )

      case 4:
        return (
          <PatientInfoForm
            onSubmit={handlePatientInfoSubmit}
            isPending={createAppointment.isPending}
          />
        )

      case 5:
        return null // Handled by parent via onConfirmed

      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <StepIndicator currentStep={step} steps={steps} />

      <Card>
        <CardHeader>
          <CardTitle>{steps[step - 1]?.label}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {step < 5 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            {t("navigation.back")}
          </Button>

          {step === 4 && (
            <LoadingButton
              onClick={() => {
                // Trigger form submit by dispatching to the form
                const form = document.querySelector("form")
                if (form) {
                  form.requestSubmit()
                }
              }}
              loading={createAppointment.isPending}
            >
              {t("submit.button")}
            </LoadingButton>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleReset}>
            {t("confirmation.newBooking")}
          </Button>
        </div>
      )}
    </div>
  )
}
