import { Calendar, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DoctorPublic } from '@/client';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: DoctorPublic;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Generate initials from a full name (up to 2 characters).
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function DoctorCard({ doctor, selected, onSelect }: DoctorCardProps) {
  const { t } = useTranslation('booking');

  return (
    <Card
      className={cn(
        'group cursor-pointer rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-teal-300 hover:-translate-y-0.5',
        selected &&
          'border-teal-500 ring-2 ring-teal-500/20 shadow-lg shadow-teal-500/10'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Doctor Avatar / Photo */}
          <div
            className={cn(
              'flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full text-[24px] sm:text-[28px] font-bold transition-all duration-300',
              selected
                ? 'bg-teal-100 text-teal-700 ring-4 ring-teal-500/20'
                : 'bg-teal-50 text-teal-600 group-hover:bg-teal-100 group-hover:ring-4 group-hover:ring-teal-500/10'
            )}
          >
            {getInitials(doctor.full_name)}
          </div>

          {/* Doctor Name */}
          <div className="space-y-1.5">
            <h3
              className={cn(
                'text-[18px] sm:text-[20px] font-bold transition-colors duration-200',
                selected ? 'text-teal-700' : 'text-gray-900'
              )}
            >
              {doctor.full_name}
            </h3>

            {/* Specialty */}
            {doctor.specialty && (
              <div className="flex items-center justify-center gap-1.5 text-[15px] text-teal-600 font-medium">
                <Stethoscope className="h-4 w-4 shrink-0" />
                <span>{doctor.specialty}</span>
              </div>
            )}

            {/* Experience */}
            {doctor.experience_years != null && (
              <div className="flex items-center justify-center gap-1.5 text-[14px] text-gray-500">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {t('doctors:fields.experience', {
                    years: doctor.experience_years,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {doctor.bio && (
            <p className="line-clamp-2 text-[14px] text-gray-500 leading-relaxed">
              {doctor.bio}
            </p>
          )}

          {/* Selected indicator */}
          {selected && (
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {t('doctorCard.selected')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
