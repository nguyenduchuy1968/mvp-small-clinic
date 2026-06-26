import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { spacing } from '@/theme/spacing';

interface CTASectionProps {
  /** Main heading text */
  title: string;
  /** Supporting description */
  description: string;
  /** Label for the CTA button */
  buttonLabel: string;
  /** Icon to display inside the button */
  buttonIcon?: LucideIcon;
  /** Callback when the CTA button is clicked */
  onButtonClick: () => void;
  /** Optional className override */
  className?: string;
  /** Background variant */
  variant?: 'gradient' | 'muted' | 'white';
}

/**
 * Reusable call-to-action section for prompting user action.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <CTASection
 *   title="Ready to Book?"
 *   description="Schedule a visit with our doctors today."
 *   buttonLabel="Book Appointment"
 *   buttonIcon={Calendar}
 *   onButtonClick={() => navigate({ to: "/booking" })}
 * />
 * ```
 */
export function CTASection({
  title,
  description,
  buttonLabel,
  buttonIcon: ButtonIcon,
  onButtonClick,
  className,
  variant = 'gradient',
}: CTASectionProps) {
  const bgClass =
    variant === 'gradient'
      ? 'bg-gradient-to-br from-teal-50 via-white to-cyan-50'
      : variant === 'muted'
        ? 'bg-[#F3F4F6]'
        : 'bg-white';

  return (
    <section
      className={cn(bgClass, 'px-4', spacing.section.default, className)}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl leading-tight">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[19px] text-gray-500 leading-relaxed">
          {description}
        </p>
        <div className="mt-10">
          <Button
            size="lg"
            className="h-14 min-w-[220px] rounded-xl bg-teal-600 text-white text-[19px] font-semibold shadow-lg transition-all duration-200 hover:bg-teal-700 hover:shadow-xl active:scale-[0.97]"
            onClick={onButtonClick}
          >
            {ButtonIcon && <ButtonIcon className="mr-2 h-5 w-5" />}
            {buttonLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
