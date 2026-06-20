import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import type { DoctorAvailabilityPublic } from '@/client';
import { cn } from '@/lib/utils';
import { formatTimeHHmm } from '@/utils';
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
        <span
          className={cn(
            'font-medium',
            !row.original.is_active && 'text-muted-foreground line-through'
          )}
        >
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
      <span
        className={cn(
          'text-muted-foreground',
          !row.original.is_active && 'line-through opacity-50'
        )}
      >
        {formatTimeHHmm(row.original.start_time)}
      </span>
    ),
  },
  {
    accessorKey: 'end_time',
    header: () => {
      const { t } = useTranslation('availability');
      return <>{t('list.columns.endTime')}</>;
    },
    cell: ({ row }) => (
      <span
        className={cn(
          'text-muted-foreground',
          !row.original.is_active && 'line-through opacity-50'
        )}
      >
        {formatTimeHHmm(row.original.end_time)}
      </span>
    ),
  },
  {
    accessorKey: 'duration_minutes',
    header: () => {
      const { t } = useTranslation('availability');
      return <>{t('list.columns.duration')}</>;
    },
    cell: ({ row }) => (
      <span
        className={cn(
          'text-muted-foreground',
          !row.original.is_active && 'line-through opacity-50'
        )}
      >
        {row.original.duration_minutes ?? 30} min
      </span>
    ),
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
