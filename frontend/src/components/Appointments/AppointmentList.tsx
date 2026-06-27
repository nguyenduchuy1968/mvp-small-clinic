import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, Search } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { AppointmentsService } from '@/client';
import { DataTable } from '@/components/Common/DataTable';
import PendingItems from '@/components/Pending/PendingItems';
import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { isClinicToday, isPastAppointment } from '@/utils/date';
import { buildColumns } from './columns';

function getAppointmentsQueryOptions() {
  return {
    queryFn: () =>
      AppointmentsService.readAppointments({ skip: 0, limit: 100 }),
    queryKey: ['appointments'],
  };
}

function AppointmentsTableContent() {
  const { t, i18n } = useTranslation('appointments');
  const navigate = useNavigate();
  const { data: appointments } = useSuspenseQuery(
    getAppointmentsQueryOptions()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return appointments.data;

    const query = searchQuery.trim().toLowerCase();
    return appointments.data.filter(
      (appt) =>
        appt.booking_number?.toLowerCase().includes(query) ||
        appt.patient_name?.toLowerCase().includes(query) ||
        appt.patient_phone?.toLowerCase().includes(query)
    );
  }, [appointments.data, searchQuery]);

  const handleRowClick = (row: AppointmentPublic) => {
    navigate({ to: '/appointments/$id', params: { id: row.id } });
  };

  const getRowClassName = (row: AppointmentPublic): string | undefined => {
    if (isPastAppointment(row.appointment_date, row.appointment_time)) {
      return 'text-muted-foreground opacity-60';
    }
    if (row.status !== 'cancelled' && isClinicToday(row.appointment_date)) {
      return 'bg-primary/15';
    }
    return undefined;
  };

  // ── Empty State ────────────────────────────────────────────────
  if (appointments.data.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={t('list.empty')}
        description="When you book appointments, they will appear here."
        action={
          <button
            type="button"
            onClick={() => navigate({ to: '/booking' })}
            className="rounded-xl bg-teal-600 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 active:scale-[0.97]"
          >
            Book an appointment
          </button>
        }
      />
    );
  }

  // ── Card View (mobile-friendly) ────────────────────────────────
  if (viewMode === 'cards') {
    return (
      <div className="space-y-5">
        {/* Search + View toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 text-[15px] rounded-xl border-gray-200"
            />
          </div>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className="shrink-0 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.97]"
          >
            Table view
          </button>
        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('list.empty')}
            description="No appointments match your search."
          />
        ) : (
          <div className="space-y-4">
            {filteredData.map((appt) => (
              <AppointmentCard
                key={appt.id}
                doctorName={appt.doctor_name}
                date={appt.appointment_date}
                time={appt.appointment_time}
                status={appt.status ?? 'pending'}
                locale={i18n.language}
                primaryActionLabel="View Details"
                onPrimaryAction={() =>
                  navigate({
                    to: '/appointments/$id',
                    params: { id: appt.id },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Table View (desktop) ───────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Search + View toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('list.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10 text-[15px] rounded-xl border-gray-200"
          />
        </div>
        <button
          type="button"
          onClick={() => setViewMode('cards')}
          className="shrink-0 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.97] sm:hidden"
        >
          Card view
        </button>
      </div>

      {filteredData.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t('list.empty')}
          description="No appointments match your search."
        />
      ) : (
        <DataTable
          columns={buildColumns()}
          data={filteredData}
          onRowClick={handleRowClick}
          getRowClassName={getRowClassName}
        />
      )}
    </div>
  );
}

function AppointmentsTable() {
  return (
    <Suspense fallback={<PendingItems />}>
      <AppointmentsTableContent />
    </Suspense>
  );
}

export function AppointmentList() {
  const { t } = useTranslation(['appointments', 'common']);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('appointments:title')}
        description={t('appointments:list.title')}
      />
      <AppointmentsTable />
    </div>
  );
}
