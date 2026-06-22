import { useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { AppointmentStatusBadge } from '@/components/Appointments/AppointmentStatusBadge';
import { Button } from '@/components/ui/button';
import { useUpdateAppointmentStatus } from '@/hooks/useUpdateAppointmentStatus';

function CancelCell({ appointment }: { appointment: AppointmentPublic }) {
  const { t } = useTranslation('appointments');
  const updateStatus = useUpdateAppointmentStatus();

  if (appointment.status !== 'confirmed') {
    return null;
  }

  const handleCancel = () => {
    const confirmed = window.confirm(t('updateStatus.cancelMessage'));
    if (!confirmed) return;

    updateStatus.mutate({
      appointmentId: appointment.id,
      requestBody: { status: 'cancelled' },
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={updateStatus.isPending}
      className="text-destructive hover:text-destructive"
    >
      <XCircle className="mr-1 h-4 w-4" />
      {t('actions.cancel')}
    </Button>
  );
}

function ActionsCell({ appointment }: { appointment: AppointmentPublic }) {
  const { t } = useTranslation('appointments');
  const navigate = useNavigate();

  return (
    <div className="flex justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate({
            to: '/appointments/$id',
            params: { id: appointment.id },
          })
        }
      >
        <Eye className="mr-1 h-4 w-4" />
        {t('actions.viewDetails')}
      </Button>
    </div>
  );
}

export function buildColumns(): ColumnDef<AppointmentPublic>[] {
  const columns: ColumnDef<AppointmentPublic>[] = [
    {
      accessorKey: 'appointment_date',
      header: () => {
        const { t } = useTranslation('appointments');
        return <>{t('list.columns.date')}</>;
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.appointment_date}</span>
      ),
    },
    {
      accessorKey: 'appointment_time',
      header: () => {
        const { t } = useTranslation('appointments');
        return <>{t('list.columns.time')}</>;
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.appointment_time}
        </span>
      ),
    },
    {
      accessorKey: 'doctor_name',
      header: () => {
        const { t } = useTranslation('appointments');
        return <>{t('list.columns.doctor')}</>;
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.doctor_name ?? '—'}</span>
      ),
      meta: { className: 'hidden md:table-cell' },
    },
    {
      accessorKey: 'patient_name',
      header: () => {
        const { t } = useTranslation('appointments');
        return <>{t('list.columns.patientName')}</>;
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.patient_name}</span>
      ),
    },
    {
      accessorKey: 'patient_phone',
      header: () => {
        const { t } = useTranslation('appointments');
        return <>{t('list.columns.patientPhone')}</>;
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.patient_phone}
        </span>
      ),
      meta: { className: 'hidden md:table-cell' },
    },
    {
      accessorKey: 'status',
      header: () => {
        const { t } = useTranslation('appointments');
        return <>{t('list.columns.status')}</>;
      },
      cell: ({ row }) => (
        <AppointmentStatusBadge status={row.original.status} />
      ),
    },
    {
      id: 'cancel',
      header: () => {
        const { t } = useTranslation('appointments');
        return <div className="text-center">{t('list.columns.cancel')}</div>;
      },
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <CancelCell appointment={row.original} />
        </div>
      ),
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      id: 'actions',
      header: () => {
        const { t } = useTranslation('common');
        return <span className="sr-only">{t('actions.filter')}</span>;
      },
      cell: ({ row }) => <ActionsCell appointment={row.original} />,
      meta: { className: 'hidden sm:table-cell' },
    },
  ];

  return columns;
}
