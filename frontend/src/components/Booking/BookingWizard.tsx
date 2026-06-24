import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type {
  AppointmentCreate,
  AppointmentPublic,
  DoctorPublic,
} from '@/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useCreateAppointment } from '@/hooks/useCreateAppointment';
import { useDoctorsPublic } from '@/hooks/useDoctorsPublic';

import { DatePicker } from './DatePicker';
import { DoctorCard } from './DoctorCard';
import { PatientInfoForm } from './PatientInfoForm';
import { StepIndicator } from './StepIndicator';
import { TimeSlotGrid } from './TimeSlotGrid';

interface BookingState {
  doctor: DoctorPublic | null;
  date: string | null;
  time: string | null;
}

interface BookingWizardProps {
  onConfirmed: (appointment: AppointmentPublic) => void;
  onSlotAlreadyBooked: () => void;
}

export function BookingWizard({
  onConfirmed,
  onSlotAlreadyBooked,
}: BookingWizardProps) {
  const { t } = useTranslation('booking');
  const [step, setStep] = useState(1);
  const [bookingState, setBookingState] = useState<BookingState>({
    doctor: null,
    date: null,
    time: null,
  });
  const autoSelectApplied = useRef(false);

  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctorsPublic();
  const { data: slotsData, isLoading: isLoadingSlots } = useAvailableSlots(
    bookingState.doctor?.id ?? null,
    bookingState.date
  );
  const createAppointment = useCreateAppointment();

  const steps = [
    { label: t('steps.selectDoctor') },
    { label: t('steps.selectDate') },
    { label: t('steps.selectTime') },
    { label: t('steps.patientInfo') },
    { label: t('steps.confirm') },
  ];

  // ── Single Doctor Auto-Select ──────────────────────────────────────
  // If exactly one active doctor is returned, auto-select and skip to
  // date selection (step 2). Only fires once per data load.
  useEffect(() => {
    if (
      !autoSelectApplied.current &&
      !isLoadingDoctors &&
      doctorsData?.data?.length === 1
    ) {
      const singleDoctor = doctorsData.data[0];
      autoSelectApplied.current = true;
      setBookingState((prev) => ({
        ...prev,
        doctor: singleDoctor,
        date: null,
        time: null,
      }));
      setStep(2);
    }
  }, [isLoadingDoctors, doctorsData]);

  const handleDoctorSelect = (doctor: DoctorPublic) => {
    setBookingState((prev) => ({ ...prev, doctor, date: null, time: null }));
    setStep(2);
  };

  const handleDateSelect = (date: string) => {
    setBookingState((prev) => ({ ...prev, date, time: null }));
    setStep(3);
  };

  const handlePreviousDay = () => {
    if (!bookingState.date) return;
    const prevDate = new Date(`${bookingState.date}T00:00:00`);
    prevDate.setDate(prevDate.getDate() - 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const d = String(prevDate.getDate()).padStart(2, '0');
    setBookingState((prev) => ({ ...prev, date: `${y}-${m}-${d}`, time: null }));
  };

  const handleNextDay = () => {
    if (!bookingState.date) return;
    const nextDate = new Date(`${bookingState.date}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    setBookingState((prev) => ({ ...prev, date: `${y}-${m}-${d}`, time: null }));
  };

  const handleTimeSelect = (time: string) => {
    setBookingState((prev) => ({ ...prev, time }));
    setStep(4);
  };

  const handlePatientInfoSubmit = (data: AppointmentCreate) => {
    if (!bookingState.doctor || !bookingState.date || !bookingState.time) {
      return;
    }

    const appointmentData: AppointmentCreate = {
      ...data,
      doctor_id: bookingState.doctor.id,
      appointment_date: bookingState.date,
      appointment_time: bookingState.time,
    };

    createAppointment.mutate(appointmentData, {
      onSuccess: (appointment) => {
        setStep(5);
        onConfirmed(appointment);
      },
      onError: (err) => {
        const errBody = (err as any)?.body;
        const errDetail = errBody?.detail;
        const status = (err as any)?.status;

        // 409 Conflict — slot was just booked by another patient
        if (status === 409) {
          onSlotAlreadyBooked();
          setStep(3);
          return;
        }

        // Extract a human-readable error message from various response formats
        let errorMessage: string;

        if (typeof errDetail === 'string') {
          // Direct error string from HTTPException (e.g., validation errors)
          errorMessage = errDetail;
        } else if (Array.isArray(errDetail) && errDetail.length > 0) {
          // FastAPI validation error array: [{loc, msg, type}, ...]
          // Join multiple validation errors into a readable list
          errorMessage = errDetail
            .map((e: { msg?: string }) => e.msg)
            .filter(Boolean)
            .join('. ');
        } else if (errBody?.message) {
          // Some error wrappers use "message" instead of "detail"
          errorMessage = errBody.message;
        } else {
          // Fallback for unexpected error shapes
          errorMessage = t('common:states.error', 'An error occurred');
        }

        toast.error(errorMessage);
      },
    });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    autoSelectApplied.current = false;
    setStep(1);
    setBookingState({ doctor: null, date: null, time: null });
    createAppointment.reset();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            {isLoadingDoctors ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !doctorsData || doctorsData.data.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {t('noDoctors')}
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
        );

      case 2:
        return (
          <DatePicker
            selectedDate={bookingState.date}
            onSelect={handleDateSelect}
          />
        );

      case 3:
        return (
          <TimeSlotGrid
            slots={slotsData?.slots}
            selectedTime={bookingState.time}
            onSelect={handleTimeSelect}
            isLoading={isLoadingSlots}
            reason={slotsData?.reason}
            date={bookingState.date}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
          />
        );

      case 4:
        return (
          <PatientInfoForm
            onSubmit={handlePatientInfoSubmit}
            isPending={createAppointment.isPending}
          />
        );

      case 5:
        return null; // Handled by parent via onConfirmed

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <StepIndicator currentStep={step} steps={steps} />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <CardTitle className="shrink-0">{steps[step - 1]?.label}</CardTitle>
          {bookingState.doctor && step >= 2 && step <= 4 && (
            <p className="text-right text-xs sm:text-sm text-muted-foreground shrink-0">
              <span className="font-medium text-foreground whitespace-nowrap">
                {bookingState.doctor.full_name}
              </span>
              {bookingState.doctor.specialty && (
                <>
                  {' '}
                  <span aria-hidden="true" className="text-muted-foreground/50">•</span>{' '}
                  <span className="whitespace-nowrap">{bookingState.doctor.specialty}</span>
                </>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {step < 5 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            {t('navigation.back')}
          </Button>

          {step === 4 && (
            <LoadingButton
              onClick={() => {
                // Trigger form submit by dispatching to the form
                const form = document.querySelector('form');
                if (form) {
                  form.requestSubmit();
                }
              }}
              loading={createAppointment.isPending}
            >
              {t('submit.button')}
            </LoadingButton>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleReset}>
            {t('confirmation.newBooking')}
          </Button>
        </div>
      )}
    </div>
  );
}
