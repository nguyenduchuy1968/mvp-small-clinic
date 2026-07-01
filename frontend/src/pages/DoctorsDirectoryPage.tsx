import { useNavigate } from '@tanstack/react-router';
import { Search, Stethoscope, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DoctorCard } from '@/components/ui/DoctorCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { useDoctorsPublic } from '@/hooks/useDoctorsPublic';
import { localizeSpecialty } from '@/hooks/useLocalizedSpecialty';

const DOCTORS_PER_PAGE = 9;

export function DoctorsDirectoryPage() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDoctorsPublic();

  // ── Search & filter state ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Derived data ───────────────────────────────────────────────────
  const allDoctors = useMemo(
    () => (data?.data ?? []).filter((d) => d.is_active),
    [data]
  );

  // Extract unique specialties for filter
  const specialties = useMemo(
    () => [...new Set(allDoctors.map((d) => d.specialty).filter((s): s is string => Boolean(s)))],
    [allDoctors]
  );

  // Filter by search + specialty
  const filteredDoctors = useMemo(() => {
    let result = allDoctors;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.full_name.toLowerCase().includes(q) ||
          d.specialty?.toLowerCase().includes(q) ||
          d.bio?.toLowerCase().includes(q)
      );
    }

    if (specialtyFilter) {
      result = result.filter((d) => d.specialty === specialtyFilter);
    }

    return result;
  }, [allDoctors, searchQuery, specialtyFilter]);

  // Paginate
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDoctors.length / DOCTORS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDoctors = filteredDoctors.slice(
    (safePage - 1) * DOCTORS_PER_PAGE,
    safePage * DOCTORS_PER_PAGE
  );

  // ── Handlers ───────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setCurrentPage(1);
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handleSpecialtyFilter = useCallback((specialty: string | null) => {
    setSpecialtyFilter(specialty);
    setCurrentPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSpecialtyFilter(null);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' || specialtyFilter !== null;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <PageHeader title={t('doctors.title')} description="" variant="muted" />

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={
                  t('doctors.searchPlaceholder') || 'Search doctors...'
                }
                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Specialty filter pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSpecialtyFilter(null)}
                className={`rounded-full px-4 py-1.5 text-[14px] font-medium transition-all ${
                  specialtyFilter === null
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('doctors.all') || 'All'}
              </button>
              {specialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => handleSpecialtyFilter(spec)}
                  className={`rounded-full px-4 py-1.5 text-[14px] font-medium transition-all ${
                    specialtyFilter === spec
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Loading state */}
        {isLoading && (
          <LoadingCard
            count={DOCTORS_PER_PAGE}
            columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          />
        )}

        {/* Error state */}
        {isError && (
          <EmptyState icon={Stethoscope} title={t('doctors.error')} />
        )}

        {/* Empty state (no results after filtering) */}
        {!isLoading &&
          !isError &&
          hasActiveFilters &&
          filteredDoctors.length === 0 && (
            <EmptyState
              icon={Search}
              title={t('doctors.noResults') || 'No doctors found'}
              description={
                t('doctors.noResultsDesc') ||
                'Try adjusting your search or filter criteria.'
              }
              action={
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="rounded-xl bg-teal-600 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-[0.97]"
                >
                  {t('doctors.clearFilters') || 'Clear Filters'}
                </button>
              }
            />
          )}

        {/* Empty state (no doctors at all) */}
        {!isLoading &&
          !isError &&
          !hasActiveFilters &&
          filteredDoctors.length === 0 && (
            <EmptyState icon={Stethoscope} title={t('doctors.noDoctors')} />
          )}

        {/* Doctor grid */}
        {!isLoading && !isError && paginatedDoctors.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {paginatedDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  name={doctor.full_name}
                  specialty={localizeSpecialty(doctor.specialty, t) ?? undefined}
                  experience={doctor.experience_years ?? undefined}
                  experienceLabel={
                    doctor.experience_years != null
                      ? t('doctors.experience', {
                          years: doctor.experience_years,
                        })
                      : undefined
                  }
                  bio={doctor.bio ?? undefined}
                  buttonLabel={t('doctors.bookAppointment')}
                  onButtonClick={() => navigate({ to: '/booking' })}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-[15px] font-medium transition-all ${
                        page === safePage
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage >= totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
