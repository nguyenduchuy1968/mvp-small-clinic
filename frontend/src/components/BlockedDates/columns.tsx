import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import type { BlockedDatePublic } from '@/client';
import { BlockedDateActionsMenu } from './BlockedDateActionsMenu';

export const columns: ColumnDef<BlockedDatePublic>[] = [
  {
    accessorKey: 'blocked_date',
    header: () => {
      const { t } = useTranslation('blockedDates');
      return <>{t('list.columns.date', 'Date')}</>;
    },
    cell: ({ row }) => {
      const date = new Date(row.original.blocked_date + 'T00:00:00');
      return <span className="font-medium">{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: 'reason',
    header: () => {
      const { t } = useTranslation('blockedDates');
      return <>{t('list.columns.reason', 'Reason')}</>;
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.reason || '—'}
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
        <BlockedDateActionsMenu blockedDate={row.original} />
      </div>
    ),
  },
];
