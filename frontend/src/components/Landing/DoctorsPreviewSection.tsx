import { useNavigate } from '@tanstack/react-router';
import { Briefcase, Calendar, Stethoscope, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctorsPublic } from '@/hooks/useDoctorsPublic';

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
          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-[#F9FAFB] shadow-sm"
                >
                  <div className="flex flex-col items-center px-6 pt-8 pb-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="mt-4 h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-1 h-4 w-5/6" />
                    <Skeleton className="mt-6 h-10 w-full rounded-xl" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {isError && (
            <p className="text-center text-destructive">{t('doctors.error')}</p>
          )}

          {!isLoading && !isError && activeDoctors.length === 0 && (
            <p className="text-center text-gray-500">
              {t('doctors.noDoctors')}
            </p>
          )}

          {!isLoading && !isError && activeDoctors.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {activeDoctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className="rounded-2xl border border-gray-200 bg-[#F9FAFB] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-200"
                >
                  <div className="flex flex-col items-center px-6 pt-8 pb-6">
                    {/* Photo placeholder */}
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-100 text-teal-600 transition-all duration-300">
                      <User className="h-12 w-12" />
                    </div>

                    {/* Doctor Name */}
                    <h3 className="mt-4 text-center text-[22px] font-bold text-gray-900">
                      {doctor.full_name}
                    </h3>

                    {/* Specialty */}
                    {doctor.specialty && (
                      <div className="mt-2 flex items-center gap-1.5 text-teal-600">
                        <Stethoscope className="h-4 w-4" />
                        <span className="text-[17px] font-medium">
                          {doctor.specialty}
                        </span>
                      </div>
                    )}

                    {/* Experience */}
                    {doctor.experience_years != null && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-gray-500">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-[15px]">
                          {t('doctors.experience', {
                            years: doctor.experience_years,
                          })}
                        </span>
                      </div>
                    )}

                    {/* Short Bio */}
                    {doctor.bio && (
                      <p className="mt-3 text-center text-[15px] text-gray-400 leading-relaxed line-clamp-3">
                        {doctor.bio}
                      </p>
                    )}

                    {/* Book Appointment button */}
                    <Button
                      size="lg"
                      className="mt-6 w-full rounded-xl bg-teal-600 text-white text-[17px] font-semibold shadow-sm transition-all duration-200 hover:bg-teal-700 active:scale-[0.97]"
                      onClick={() => navigate({ to: '/booking' })}
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      {t('doctors.bookAppointment')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {!isLoading && !isError && activeDoctors.length > 0 && (
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="h-12 min-w-[200px] rounded-xl border-2 border-teal-200 bg-white text-teal-700 text-[19px] font-semibold shadow-sm transition-all duration-200 hover:bg-teal-50 hover:border-teal-300 active:scale-[0.97]"
              onClick={() => navigate({ to: '/booking' })}
            >
              <Calendar className="mr-2 h-5 w-5" />
              {t('doctors.viewAll')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
