import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type {
  AppointmentCreate,
  AppointmentPublic,
  DoctorPublic,
} from '@/client';
import { BookingBreadcrumb } from '@/components/Booking/BookingBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useCreateAppointment } from '@/hooks/useCreateAppointment';
import { useDoctorsPublic } from '@/hooks/useDoctorsPublic';
import { cn } from '@/lib/utils';
import { getClinicTodayString } from '@/utils/date';

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
    setBookingState((prev) => ({
      ...prev,
      date: `${y}-${m}-${d}`,
      time: null,
    }));
  };

  const handleNextDay = () => {
    if (!bookingState.date) return;
    const nextDate = new Date(`${bookingState.date}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    setBookingState((prev) => ({
      ...prev,
      date: `${y}-${m}-${d}`,
      time: null,
    }));
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
          errorMessage = t('common:states.error');
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

  const todayStr = getClinicTodayString();

  // Quick options: Today, Tomorrow — always available during date selection
  const tomorrowStr = (() => {
    const d = new Date(`${todayStr}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const quickOptions = [
    { label: t('datePicker.today'), value: todayStr },
    { label: t('datePicker.tomorrow'), value: tomorrowStr },
  ];

  const handleQuickDate = (dateStr: string) => {
    setBookingState((prev) => ({ ...prev, date: dateStr, time: null }));
    // Stay on current step — user can continue browsing
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            {isLoadingDoctors ? (
              <div
                className="space-y-4"
                role="status"
                aria-label={t('doctorCard.loadingAria')}
              >
                <div className="flex items-center gap-2.5 text-[15px] text-gray-700 mb-4">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
                  <span className="font-medium">
                    {t('doctorCard.loading', 'Finding available doctors...')}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card
                      key={i}
                      className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <CardContent className="p-6 sm:p-7">
                        <div className="flex flex-col items-center gap-4">
                          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
                          <div className="space-y-2 text-center w-full">
                            <Skeleton className="h-6 w-3/4 mx-auto" />
                            <Skeleton className="h-4 w-1/2 mx-auto" />
                            <Skeleton className="h-4 w-1/3 mx-auto" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : !doctorsData || doctorsData.data.length === 0 ? (
              <div
                className="flex flex-col items-center gap-4 rounded-2xl border-2 border-blue-200 bg-linear-to-b from-blue-50 to-white p-8 sm:p-10 text-center shadow-sm"
                role="status"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <span className="text-[24px] font-bold text-blue-500">:</span>
                </div>
                <div className="space-y-2 max-w-sm">
                  <p className="text-[18px] font-bold text-blue-700">
                    {t('noDoctors')}
                  </p>
                  <p className="text-[15px] leading-relaxed text-blue-600">
                    {t(
                      'noDoctorsHint',
                      'Please check back later or contact the clinic for availability.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="space-y-6">
            {/* Today / Tomorrow quick actions — always visible */}
            <div className="flex flex-wrap gap-3">
              {quickOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    bookingState.date === option.value ? 'default' : 'outline'
                  }
                  onClick={() => handleQuickDate(option.value)}
                  className={cn(
                    'flex-1 sm:flex-none rounded-xl px-6 py-3 text-[15px] font-semibold transition-all duration-200',
                    bookingState.date === option.value
                      ? 'bg-teal-600 border-teal-600 text-white shadow-lg'
                      : 'border-teal-200 bg-teal-50/60 text-teal-700 hover:bg-teal-100 hover:border-teal-300 hover:shadow-md'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <DatePicker
              selectedDate={bookingState.date}
              onSelect={handleDateSelect}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Today / Tomorrow quick actions — always visible */}
            <div className="flex flex-wrap gap-3">
              {quickOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    bookingState.date === option.value ? 'default' : 'outline'
                  }
                  onClick={() => handleQuickDate(option.value)}
                  className={cn(
                    'flex-1 sm:flex-none rounded-xl px-6 py-3 text-[15px] font-semibold transition-all duration-200',
                    bookingState.date === option.value
                      ? 'bg-teal-600 border-teal-600 text-white shadow-lg'
                      : 'border-teal-200 bg-teal-50/60 text-teal-700 hover:bg-teal-100 hover:border-teal-300 hover:shadow-md'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
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
          </div>
        );

      case 4:
        return (
          <PatientInfoForm
            onSubmit={handlePatientInfoSubmit}
            isPending={createAppointment.isPending}
            doctor={bookingState.doctor}
            date={bookingState.date}
            time={bookingState.time}
          />
        );

      case 5:
        return null; // Handled by parent via onConfirmed

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Breadcrumb navigation — always visible during booking */}
      <BookingBreadcrumb
        items={[
          { label: t('breadcrumb.home'), href: '/' },
          { label: t('breadcrumb.booking') },
        ]}
      />

      <StepIndicator currentStep={step} steps={steps} />

      <Card className="rounded-2xl border border-gray-200 shadow-md overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap sm:flex-nowrap border-b border-gray-100 bg-white pb-5 px-6 sm:px-8 pt-7 sm:pt-8">
          <div className="flex items-center gap-3 min-w-0">
            <CardTitle className="shrink-0 text-[22px] sm:text-[24px] font-bold text-gray-900 tracking-tight">
              {steps[step - 1]?.label}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {bookingState.doctor && step >= 2 && step <= 4 && (
              <div className="flex items-center gap-3 shrink-0">
                {/* Doctor avatar initials */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-[16px] font-bold shadow-sm ring-2 ring-teal-500/10">
                  {bookingState.doctor.full_name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((n) => n.charAt(0))
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="text-right min-w-0">
                  <p className="text-[17px] font-bold text-gray-900 leading-tight truncate max-w-55">
                    {bookingState.doctor.full_name}
                  </p>
                  {bookingState.doctor.specialty && (
                    <p className="text-[14px] text-teal-600 font-semibold leading-tight mt-0.5 truncate max-w-55">
                      {bookingState.doctor.specialty}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 lg:p-10">{renderStep()}</CardContent>
      </Card>

      {step < 5 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-xl border-gray-300 px-7 py-3 text-[16px] font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-40"
          >
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
              className="rounded-xl bg-teal-600 px-9 py-3 text-[17px] font-bold hover:bg-teal-700 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all"
            >
              {t('submit.button')}
            </LoadingButton>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-xl border-gray-300 px-8 py-3 text-[16px] font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            {t('confirmation.newBooking')}
          </Button>
        </div>
      )}
    </div>
  );
}
