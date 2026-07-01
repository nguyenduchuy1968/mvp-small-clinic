import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { DoctorCard } from '@/components/ui/DoctorCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useDoctorsPublic } from '@/hooks/useDoctorsPublic';
import { localizeSpecialty } from '@/hooks/useLocalizedSpecialty';

export function DoctorsPreviewSection() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDoctorsPublic();

  const activeDoctors = (data?.data ?? [])
    .filter((doctor) => doctor.is_active)
    .slice(0, 3);

  return (
    <section className="bg-[#F3F4F6] px-4 py-24 md:py-32" id="doctors-section">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title={t('doctors.title')} />

        <div className="mt-16">
          {/* Loading state */}
          {isLoading && <LoadingCard count={3} />}

          {/* Error state */}
          {isError && (
            <p className="text-center text-destructive">{t('doctors.error')}</p>
          )}

          {/* Empty state */}
          {!isLoading && !isError && activeDoctors.length === 0 && (
            <EmptyState title={t('doctors.noDoctors')} />
          )}

          {/* Doctor cards */}
          {!isLoading && !isError && activeDoctors.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {activeDoctors.map((doctor) => (
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
          )}
        </div>

        {!isLoading && !isError && activeDoctors.length > 0 && (
          <div className="mt-12 text-center">
            <button
              type="button"
              className="h-12 min-w-[200px] rounded-xl border-2 border-teal-200 bg-white px-6 text-[19px] font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:bg-teal-50 hover:border-teal-300 active:scale-[0.97]"
              onClick={() => navigate({ to: '/booking' })}
            >
              {t('doctors.viewAll')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
