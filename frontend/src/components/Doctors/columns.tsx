import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import type { DoctorPublic, UserPublic } from '@/client';
import { cn } from '@/lib/utils';
import { DoctorActionsMenu } from './DoctorActionsMenu';

export function buildColumns(
  user: UserPublic | null | undefined
): ColumnDef<DoctorPublic>[] {
  const canManageDoctors = user?.is_superuser === true;

  const columns: ColumnDef<DoctorPublic>[] = [
    {
      accessorKey: 'full_name',
      header: () => {
        const { t } = useTranslation('doctors');
        return <>{t('list.columns.fullName')}</>;
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.full_name}</span>
      ),
    },
    {
      accessorKey: 'specialty',
      header: () => {
        const { t } = useTranslation('doctors');
        return <>{t('list.columns.specialty')}</>;
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.specialty || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'experience_years',
      header: () => {
        const { t } = useTranslation('doctors');
        return <>{t('list.columns.experience')}</>;
      },
      cell: ({ row }) => {
        const { t } = useTranslation('doctors');
        const years = row.original.experience_years;
        return (
          <span className="text-muted-foreground">
            {years != null ? t('fields.experience', { years }) : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: () => {
        const { t } = useTranslation('doctors');
        return <>{t('list.columns.status')}</>;
      },
      cell: ({ row }) => {
        const { t } = useTranslation('doctors');
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
              {row.original.is_active ? t('status.active') : t('status.inactive')}
            </span>
          </div>
        );
      },
    },
  ];

  if (canManageDoctors) {
    columns.push({
      id: 'actions',
      header: () => {
        const { t } = useTranslation('common');
        return <span className="sr-only">{t('actions.filter')}</span>;
      },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DoctorActionsMenu doctor={row.original} />
        </div>
      ),
    });
  }

  return columns;
}
