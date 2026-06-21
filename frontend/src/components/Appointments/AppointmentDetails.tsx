import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  StickyNote,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointment } from '@/hooks/useAppointment';
import { formatDateForDisplay, formatDateLong } from '@/utils/date';

interface AppointmentDetailsProps {
  appointmentId: string;
  onBack: () => void;
}

function AppointmentInfoCard({
  appointment,
  t,
  locale,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
  locale: string;
}) {
  const statusVariant =
    appointment.status === 'confirmed'
      ? 'default'
      : appointment.status === 'cancelled'
        ? 'destructive'
        : 'secondary';

  const statusLabel =
    appointment.status === 'pending'
      ? t('status.pending')
      : appointment.status === 'confirmed'
        ? t('status.confirmed')
        : t('status.cancelled');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.appointmentInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('list.columns.status')}
          </span>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {formatDateLong(appointment.appointment_date, locale)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateForDisplay(appointment.appointment_date, locale)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{appointment.appointment_time}</span>
        </div>
        {appointment.created_at && (
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {new Date(appointment.created_at).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('detail.createdAt')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PatientInfoCard({
  appointment,
  t,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.patientInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{appointment.patient_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{appointment.patient_phone}</span>
        </div>
        {appointment.patient_email && (
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{appointment.patient_email}</span>
          </div>
        )}
        {appointment.contact_method && (
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium capitalize">
                {appointment.contact_method}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('detail.contactMethod')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DoctorInfoCard({
  appointment,
  t,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.doctorInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">
            {appointment.doctor_name ?? appointment.doctor_id}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function NotesCard({
  appointment,
  t,
}: {
  appointment: AppointmentPublic;
  t: (key: string) => string;
}) {
  if (!appointment.notes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.notes')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {appointment.notes}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AppointmentDetails({
  appointmentId,
  onBack,
}: AppointmentDetailsProps) {
  const { t, i18n } = useTranslation(['appointments', 'common']);
  const locale = i18n.language;

  const { data: appointment, isLoading } = useAppointment(appointmentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common:actions.back')}
        </Button>
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('common:states.notFound')}</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common:actions.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common:actions.back')}
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('detail.title')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('list.columns.id')}: {appointment.id}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AppointmentInfoCard appointment={appointment} t={t} locale={locale} />
        <PatientInfoCard appointment={appointment} t={t} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DoctorInfoCard appointment={appointment} t={t} />
        <NotesCard appointment={appointment} t={t} />
      </div>
    </div>
  );
}
