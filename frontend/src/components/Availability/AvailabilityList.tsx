import { useSuspenseQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { AvailabilityService } from '@/client';
import { DataTable } from '@/components/Common/DataTable';
import PendingItems from '@/components/Pending/PendingItems';
import { columns } from './columns';
import CreateAvailability from './CreateAvailability';

function getAvailabilitiesQueryOptions(doctorId: string) {
  return {
    queryFn: () =>
      AvailabilityService.readDoctorAvailabilities({
        doctorId,
        skip: 0,
        limit: 100,
        activeOnly: false,
      }),
    queryKey: ['availabilities', doctorId],
    enabled: !!doctorId,
  };
}

interface AvailabilitiesTableContentProps {
  doctorId: string;
}

function AvailabilitiesTableContent({
  doctorId,
}: AvailabilitiesTableContentProps) {
  const { t } = useTranslation('availability');
  const { data: availabilities } = useSuspenseQuery(
    getAvailabilitiesQueryOptions(doctorId)
  );

  if (availabilities.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t('list.empty')}</h3>
      </div>
    );
  }

  return <DataTable columns={columns} data={availabilities.data} />;
}

interface AvailabilitiesTableProps {
  doctorId: string;
}

function AvailabilitiesTable({ doctorId }: AvailabilitiesTableProps) {
  return (
    <Suspense fallback={<PendingItems />}>
      <AvailabilitiesTableContent doctorId={doctorId} />
    </Suspense>
  );
}

interface AvailabilityListProps {
  doctorId: string;
}

export function AvailabilityList({ doctorId }: AvailabilityListProps) {
  const { t } = useTranslation(['availability', 'common']);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('availability:title')}
          </h1>
          <p className="text-muted-foreground">
            {t('availability:list.title')}
          </p>
        </div>
        <CreateAvailability doctorId={doctorId} />
      </div>
      <AvailabilitiesTable doctorId={doctorId} />
    </div>
  );
}
