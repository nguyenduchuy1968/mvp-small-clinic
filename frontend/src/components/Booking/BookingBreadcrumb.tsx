import { useNavigate } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * A single breadcrumb item.
 *
 * - `label`: Display text (localized).
 * - `href`: Optional route path. If provided, the item is clickable.
 *   If omitted, the item is rendered as plain text (current page).
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BookingBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Lightweight breadcrumb navigation for the Booking Wizard.
 *
 * Renders a horizontal list of breadcrumb items separated by chevron icons.
 * The last item (current page) is rendered as plain text; all preceding
 * items are clickable links that navigate via TanStack Router.
 *
 * Designed to be extended later to support deeper paths such as:
 *   Home > Book Appointment > Choose Doctor
 *   Home > Book Appointment > Confirmation
 */
export function BookingBreadcrumb({ items }: BookingBreadcrumbProps) {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[14px] text-muted-foreground"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {/* Chevron separator (skip for first item) */}
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            )}

            {isLast || !item.href ? (
              /* Current / non-clickable item */
              <span
                className={
                  isLast ? 'text-foreground font-medium' : 'text-gray-500'
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              /* Clickable breadcrumb link */
              <Button
                variant="link"
                className="h-auto min-h-0 p-0 text-[14px] text-gray-500 hover:text-teal-600 no-underline hover:no-underline transition-colors font-normal"
                onClick={() => navigate({ to: item.href! })}
              >
                {item.label}
              </Button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
