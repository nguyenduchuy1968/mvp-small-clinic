import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { AppointmentPublic } from '@/client';
import { LanguageSwitcher } from '@/components/Common/LanguageSwitcher';
import { clinicConfig } from '@/config/clinic';

import { BookingConfirmation } from './BookingConfirmation';
import { BookingWizard } from './BookingWizard';

export function BookingPage() {
  const { t, i18n } = useTranslation('booking');
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<AppointmentPublic | null>(null);

  const isVietnamese = i18n.language?.startsWith('vi');
  const clinicName = isVietnamese ? clinicConfig.name : clinicConfig.nameEn;
  const address = isVietnamese ? clinicConfig.address : clinicConfig.addressEn;

  const handleConfirmed = (appointment: AppointmentPublic) => {
    setConfirmedAppointment(appointment);
  };

  const handleNewBooking = () => {
    setConfirmedAppointment(null);
  };

  const handleSlotAlreadyBooked = () => {
    toast.error(t('errors.slotAlreadyBooked'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12 lg:pb-16">
        {confirmedAppointment ? (
          <BookingConfirmation
            appointment={confirmedAppointment}
            onNewBooking={handleNewBooking}
          />
        ) : (
          <div className="space-y-8">
            {/* ── Premium Clinic Identity Panel ──────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/*
               * Responsive layout — two completely independent structures:
               *
               *   Mobile (<640px): Two rows
               *     Row 1: Logo (left) ...................... Language (right)
               *     Row 2: Clinic Name (full width)
               *            Address (full width)
               *            Telephone (full width)
               *            Working Hours (full width)
               *
               *   Desktop (≥640px): Single row
               *     [Logo] [Clinic info (name, address, phone, hours)] [Language]
               */}
              <div className="p-6 sm:p-8">
                {/* ═══════════════════════════════════════════════════════
                   MOBILE LAYOUT (<640px) — visible only on small screens
                   ═══════════════════════════════════════════════════════ */}
                <div className="sm:hidden">
                  {/* Row 1: Logo + Language Switcher */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
                      <span className="text-[36px] font-bold">+</span>
                    </div>
                    <div className="shrink-0 pt-1">
                      <LanguageSwitcher />
                    </div>
                  </div>

                  {/* Row 2: Clinic info — full width */}
                  <div className="mt-5">
                    <h2 className="text-xl font-bold text-teal-700 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {clinicName}
                    </h2>
                    <div className="mt-3 space-y-2">
                      <p className="text-[15px] font-medium text-gray-600 flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                        <span>{address}</span>
                      </p>
                      <p className="text-[15px] font-medium text-blue-600 flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                        {clinicConfig.phone}
                      </p>
                      <p className="text-[15px] font-medium text-emerald-600 flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="block">
                          {t('clinicInfo.weekday')}:{' '}
                          {clinicConfig.workingHours.weekday}
                        </span>
                        <span className="block">
                          {t('clinicInfo.saturday')}:{' '}
                          {clinicConfig.workingHours.saturday}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════
                   DESKTOP LAYOUT (≥640px) — hidden on small screens
                   ═══════════════════════════════════════════════════════ */}
                <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto] sm:gap-6">
                  {/* Column 1: Logo */}
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
                    <span className="text-[42px] font-bold">+</span>
                  </div>

                  {/* Column 2: Clinic info */}
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-teal-700 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {clinicName}
                    </h2>
                    <div className="mt-3 space-y-2">
                      <p className="text-[15px] font-medium text-gray-600 flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                        <span>{address}</span>
                      </p>
                      <p className="text-[15px] font-medium text-blue-600 flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                        {clinicConfig.phone}
                      </p>
                      <p className="text-[15px] font-medium text-emerald-600 flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {t('clinicInfo.weekday')}:{' '}
                        {clinicConfig.workingHours.weekday}
                        <span className="text-gray-300 mx-1">|</span>
                        {t('clinicInfo.saturday')}:{' '}
                        {clinicConfig.workingHours.saturday}
                      </p>
                    </div>
                  </div>

                  {/* Column 3: Language Switcher */}
                  <div className="shrink-0 pt-1.5">
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>

            {/* Main booking wizard */}
            <BookingWizard
              onConfirmed={handleConfirmed}
              onSlotAlreadyBooked={handleSlotAlreadyBooked}
            />
          </div>
        )}
      </main>
    </div>
  );
}
