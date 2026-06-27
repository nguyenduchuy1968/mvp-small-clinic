import { Briefcase, Calendar, Stethoscope } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  /** Doctor's full name */
  name: string;
  /** URL to doctor's photo */
  photo?: string;
  /** Medical specialty */
  specialty?: string;
  /** Years of experience */
  experience?: number;
  /** Localized experience label (e.g. "12 years experience") */
  experienceLabel?: string;
  /** Short biography */
  bio?: string;
  /** Optional badge text (e.g. "Available", "Senior") */
  badge?: string;
  /** Label for the CTA button */
  buttonLabel: string;
  /** Callback when the CTA button is clicked */
  onButtonClick: () => void;
  /** Optional footer content rendered below the CTA button */
  footer?: ReactNode;
  /** Optional children rendered between bio and CTA button */
  children?: ReactNode;
  /** Optional className override */
  className?: string;
}

/**
 * Reusable doctor profile card for use on Landing, Doctor Directory, etc.
 *
 * Supports optional badge, footer, and children for extensibility.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <DoctorCard
 *   name="Dr. Nguyen Van A"
 *   specialty="General Practitioner"
 *   experience={12}
 *   experienceLabel="12 years experience"
 *   bio="Experienced doctor dedicated to patient care."
 *   badge="Available"
 *   buttonLabel="Book Appointment"
 *   onButtonClick={() => navigate({ to: "/booking" })}
 * />
 * ```
 */
export function DoctorCard({
  name,
  photo,
  specialty,
  experience,
  experienceLabel,
  bio,
  badge,
  buttonLabel,
  onButtonClick,
  footer,
  children,
  className,
}: DoctorCardProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-200',
        className
      )}
    >
      <div className="flex flex-col items-center px-6 pt-8 pb-6">
        {/* Badge */}
        {badge && (
          <Badge
            variant="default"
            className="mb-3 bg-teal-500 text-white hover:bg-teal-600"
          >
            {badge}
          </Badge>
        )}

        {/* Photo */}
        <Avatar src={photo} alt={name} size="xl" />

        {/* Name */}
        <h3 className="mt-4 text-center text-[22px] font-bold text-gray-900">
          {name}
        </h3>

        {/* Specialty */}
        {specialty && (
          <div className="mt-2 flex items-center gap-1.5 text-teal-600">
            <Stethoscope className="h-4 w-4" />
            <span className="text-[17px] font-medium">{specialty}</span>
          </div>
        )}

        {/* Experience */}
        {(experience != null || experienceLabel) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-gray-500">
            <Briefcase className="h-4 w-4" />
            <span className="text-[15px]">
              {experienceLabel ?? `${experience} years experience`}
            </span>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="mt-3 text-center text-[15px] text-gray-400 leading-relaxed line-clamp-3">
            {bio}
          </p>
        )}

        {/* Optional children (rendered between bio and CTA) */}
        {children}

        {/* CTA Button */}
        <Button
          size="lg"
          className="mt-6 w-full rounded-xl bg-teal-600 text-white text-[17px] font-semibold shadow-sm transition-all duration-200 hover:bg-teal-700 active:scale-[0.97]"
          onClick={onButtonClick}
        >
          <Calendar className="mr-2 h-5 w-5" />
          {buttonLabel}
        </Button>

        {/* Optional footer */}
        {footer}
      </div>
    </Card>
  );
}
