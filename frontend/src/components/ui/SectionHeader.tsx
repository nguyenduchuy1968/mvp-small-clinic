import { cn } from '@/lib/utils';
import { typography } from '@/theme/typography';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'center' | 'left';
}

/**
 * Reusable section heading composed from theme typography tokens.
 *
 * ---
 * **Usage:**
 * ```tsx
 * <SectionHeader
 *   title="Our Services"
 *   subtitle="Comprehensive care for the whole family"
 *   align="center"
 * />
 * ```
 */
export function SectionHeader({
  title,
  subtitle,
  className,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      <h2 className={cn(typography.section.title)}>{title}</h2>
      {subtitle && (
        <p
          className={cn(
            'mx-auto mt-4 max-w-2xl',
            typography.section.subtitle,
            align === 'center' ? 'mx-auto' : 'mx-0'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
