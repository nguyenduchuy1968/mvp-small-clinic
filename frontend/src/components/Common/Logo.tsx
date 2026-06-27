import { Link } from '@tanstack/react-router';

import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import iconLight from '/assets/images/brand-icon-light.svg';
import icon from '/assets/images/brand-icon.svg';
import logoLight from '/assets/images/brand-logo-light.svg';
import logo from '/assets/images/brand-logo.svg';

interface LogoProps {
  variant?: 'full' | 'icon' | 'responsive';
  className?: string;
  asLink?: boolean;
}

export function Logo({
  variant = 'full',
  className,
  asLink = true,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const fullLogo = isDark ? logoLight : logo;
  const iconLogo = isDark ? iconLight : icon;

  const content =
    variant === 'responsive' ? (
      <>
        <img
          src={fullLogo}
          alt="HealthClinic"
          className={cn(
            'h-7 w-auto group-data-[collapsible=icon]:hidden',
            className
          )}
        />
        <img
          src={iconLogo}
          alt="HealthClinic"
          className={cn(
            'size-6 hidden group-data-[collapsible=icon]:block',
            className
          )}
        />
      </>
    ) : (
      <img
        src={variant === 'full' ? fullLogo : iconLogo}
        alt="HealthClinic"
        className={cn(variant === 'full' ? 'h-7 w-auto' : 'size-6', className)}
      />
    );

  if (!asLink) {
    return content;
  }

  return <Link to="/">{content}</Link>;
}
