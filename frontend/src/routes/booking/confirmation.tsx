import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { AppointmentsService } from '@/client';
import { BookingConfirmation } from '@/components/Booking/BookingConfirmation';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/booking/confirmation')({
  component: BookingConfirmationPage,
  validateSearch: (
    search: Record<string, unknown>
  ): { appointmentId?: string } => {
    return {
      appointmentId: search.appointmentId as string | undefined,
    };
  },
  head: () => ({
    meta: [
      {
        title: 'Appointment Confirmed',
      },
    ],
  }),
});

function BookingConfirmationPage() {
  const { appointmentId } = Route.useSearch();
  const { t } = useTranslation('booking');

  const { data: appointment, isLoading } = useQuery({
    queryFn: () =>
      AppointmentsService.readAppointment({
        appointmentId: appointmentId!,
      }),
    queryKey: ['appointment', appointmentId],
    enabled: !!appointmentId,
  });

  if (!appointmentId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {t('common:states.notFound', 'Not found')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {t('common:states.loading', 'Loading...')}
        </p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          {t('common:states.notFound', 'Not found')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">{t('confirmation.title')}</h1>
      </header>
      <main className="mx-auto max-w-4xl p-6 md:p-8">
        <BookingConfirmation appointment={appointment} />
      </main>
    </div>
  );
}
