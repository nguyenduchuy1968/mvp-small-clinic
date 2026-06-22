import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateLong } from '@/utils/date';

interface BookingConfirmationProps {
  appointment: AppointmentPublic;
}

function formatTime(time: string): string {
  return time.length > 5 ? time.slice(0, 5) : time;
}

export function BookingConfirmation({ appointment }: BookingConfirmationProps) {
  const { t, i18n } = useTranslation('booking');
  const navigate = useNavigate();

  const handleNewBooking = () => {
    // Use window.location.href to force a full page reload, which resets
    // the BookingPage state (confirmedAppointment) when the component is
    // rendered inline at /booking. navigate() to the same route is a no-op.
    window.location.href = '/booking';
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Section 1: Success Card */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            <CardTitle className="text-xl text-green-700 dark:text-green-300">
              {t('confirmation.title')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-green-600 dark:text-green-400">
            {t('confirmation.successMessage')}
          </p>

          {/* Appointment details */}
          <div className="rounded-lg border bg-background p-4">
            <dl className="space-y-3 text-sm">
              {/* Doctor */}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t('confirmation.doctor')}
                </dt>
                <dd className="font-medium text-right max-w-[60%]">
                  {appointment.doctor_name ?? appointment.doctor_id}
                </dd>
              </div>
              {/* Date */}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t('confirmation.date')}
                </dt>
                <dd className="font-medium">
                  {formatDateLong(appointment.appointment_date, i18n.language)}
                </dd>
              </div>
              {/* Time */}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t('confirmation.time')}
                </dt>
                <dd className="font-medium">
                  {formatTime(appointment.appointment_time)}
                </dd>
              </div>
              {/* Divider */}
              <hr className="border-t" />
              {/* Booking Number — visually dominant */}
              <div className="flex justify-between items-center pt-1">
                <dt className="text-sm font-semibold text-muted-foreground">
                  {t('confirmation.bookingReference')}
                </dt>
                <dd className="font-mono text-lg font-bold text-primary tracking-wider">
                  {appointment.booking_number}
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Attention Message */}
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('confirmation.attentionTitle')}</AlertTitle>
        <AlertDescription>
          {t('confirmation.attentionMessage')}
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
          {t('confirmation.newBooking')}
        </Button>
      </div>
    </div>
  );
}
