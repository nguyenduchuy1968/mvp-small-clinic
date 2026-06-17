import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import type { DoctorAvailabilityPublic } from '@/client';
import { cn } from '@/lib/utils';
import { AvailabilityActionsMenu } from './AvailabilityActionsMenu';

export const columns: ColumnDef<DoctorAvailabilityPublic>[] = [
  {
    accessorKey: 'weekday',
    header: () => {
      const { t } = useTranslation('availability');
      return <>{t('list.columns.weekday')}</>;
    },
    cell: ({ row }) => {
      const { t } = useTranslation('availability');
      return (
        <span className="font-medium">
          {t(`weekdays.${row.original.weekday}`)}
        </span>
      );
    },
  },
  {
    accessorKey: 'start_time',
    header: () => {
      const { t } = useTranslation('availability');
      return <>{t('list.columns.startTime')}</>;
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.start_time}</span>
    ),
  },
  {
    accessorKey: 'end_time',
    header: () => {
      const { t } = useTranslation('availability');
      return <>{t('list.columns.endTime')}</>;
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.end_time}</span>
    ),
  },
  {
    accessorKey: 'duration_minutes',
    header: () => {
      const { t } = useTranslation('availability');
      return <>{t('list.columns.duration')}</>;
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.duration_minutes ?? 30} min
      </span>
    ),
  },
  {
    accessorKey: 'is_active',
    header: () => {
      const { t } = useTranslation('availability');
      return <>{t('list.columns.status')}</>;
    },
    cell: ({ row }) => {
      const { t } = useTranslation('availability');
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'size-2 rounded-full',
              row.original.is_active ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span
            className={row.original.is_active ? '' : 'text-muted-foreground'}
          >
            {row.original.is_active
              ? t('status.active')
              : t('status.inactive')}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => {
      const { t } = useTranslation('common');
      return <span className="sr-only">{t('actions.filter')}</span>;
    },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <AvailabilityActionsMenu availability={row.original} />
      </div>
    ),
  },
];
