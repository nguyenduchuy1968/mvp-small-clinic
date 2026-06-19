import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BookingConfirmationProps {
  appointment: AppointmentPublic;
}

function formatTime(time: string): string {
  return time.length > 5 ? time.slice(0, 5) : time;
}

function formatDate(dateStr: string): string {
  // Display date in a user-friendly format
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function BookingConfirmation({ appointment }: BookingConfirmationProps) {
  const { t } = useTranslation('booking');

  return (
    <div className="mx-auto max-w-lg space-y-6">
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
          <p className="text-center text-sm text-muted-foreground">
            {t('confirmation.message', {
              doctorName: appointment.doctor_id,
              date: formatDate(appointment.appointment_date),
              time: formatTime(appointment.appointment_time),
            })}
          </p>

          <div className="rounded-lg border bg-background p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono font-medium">{appointment.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t('form.patientName')}
                </dt>
                <dd className="font-medium">{appointment.patient_name}</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
