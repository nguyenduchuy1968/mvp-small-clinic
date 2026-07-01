import { useTranslation } from 'react-i18next';

import type { DoctorPublic } from '@/client';
import { DoctorCard as UiDoctorCard } from '@/components/ui/DoctorCard';
import { useLocalizedSpecialty } from '@/hooks/useLocalizedSpecialty';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: DoctorPublic;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Booking-specific doctor selection card.
 *
 * Wraps the reusable `ui/DoctorCard` with selection behaviour:
 * - Accepts a `DoctorPublic` object and maps it to the UI card props
 * - Renders a selection indicator via the `children` slot
 * - The entire card is clickable for selection (no separate CTA button)
 *
 * @see {@link UiDoctorCard} for the base card component used elsewhere
 */
export function DoctorCard({ doctor, selected, onSelect }: DoctorCardProps) {
  const { t } = useTranslation('booking');
  const localizedSpecialty = useLocalizedSpecialty(doctor.specialty);

  const experienceLabel =
    doctor.experience_years != null
      ? t('doctors:fields.experience', { years: doctor.experience_years })
      : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'cursor-pointer outline-none transition-all duration-300',
        selected &&
          'rounded-2xl ring-2 ring-teal-500/20 shadow-lg shadow-teal-500/10'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <UiDoctorCard
        name={doctor.full_name}
        specialty={localizedSpecialty ?? undefined}
        experience={doctor.experience_years ?? undefined}
        experienceLabel={experienceLabel}
        bio={doctor.bio ?? undefined}
        buttonLabel={t('doctorCard.selectLabel')}
        onButtonClick={onSelect}
        className={cn(
          'border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-teal-300 hover:-translate-y-0.5',
          selected && 'border-teal-500 shadow-lg shadow-teal-500/10'
        )}
      >
        {/* Selected indicator rendered inside the card via children slot */}
        {selected && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {t('doctorCard.selected')}
          </div>
        )}
      </UiDoctorCard>
    </div>
  );
}
