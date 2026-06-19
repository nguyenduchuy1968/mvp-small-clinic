import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { LanguageSwitcher } from '@/components/Common/LanguageSwitcher';
import { toast } from 'sonner';

import { BookingConfirmation } from './BookingConfirmation';
import { BookingWizard } from './BookingWizard';

export function BookingPage() {
  const { t } = useTranslation('booking');
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<AppointmentPublic | null>(null);

  const handleConfirmed = (appointment: AppointmentPublic) => {
    setConfirmedAppointment(appointment);
  };

  const handleSlotAlreadyBooked = () => {
    toast.error(t('errors.slotAlreadyBooked'));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">{t('title')}</h1>
        <LanguageSwitcher />
      </header>
      <main className="mx-auto max-w-4xl p-6 md:p-8">
        {confirmedAppointment ? (
          <BookingConfirmation appointment={confirmedAppointment} />
        ) : (
          <BookingWizard
            onConfirmed={handleConfirmed}
            onSlotAlreadyBooked={handleSlotAlreadyBooked}
          />
        )}
      </main>
    </div>
  );
}
