import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

/**
 * A single breadcrumb item.
 *
 * - `label`: Display text (localized).
 * - `href`: Optional route path. If provided, the item is rendered as a
 *   semantic `<Link>` (clickable). If omitted, the item is rendered as
 *   plain text (current page).
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BookingBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Accessible, semantic breadcrumb navigation for the Booking Wizard.
 *
 * Renders an `<ol>` list of breadcrumb items separated by chevron icons.
 * The last item (current page) is rendered as plain `<span>` text with
 * `aria-current="page"`; all preceding items with an `href` are rendered
 * as semantic `<Link>` elements from TanStack Router.
 *
 * **Accessibility:**
 * - Wrapped in `<nav aria-label="Breadcrumb">`
 * - Uses `<ol>` / `<li>` for proper list semantics
 * - `aria-current="page"` on the current item
 * - Semantic `<Link>` elements (not `<button>`) for navigation
 *
 * **Responsive behaviour:**
 * - Long labels are truncated with ellipsis
 * - Container allows horizontal scroll if items overflow
 * - Chevron icons never shrink below their natural width
 *
 * **Usage:**
 * ```tsx
 * <BookingBreadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Book Appointment' },
 *   ]}
 * />
 * ```
 */
export function BookingBreadcrumb({ items }: BookingBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto">
      <ol className="flex items-center gap-1.5 text-[14px] text-muted-foreground min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5 min-w-0">
              {/* Chevron separator (skip for first item) */}
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              )}

              {isLast || !item.href ? (
                /* Current / non-clickable item */
                <span
                  className={
                    isLast
                      ? 'truncate text-gray-900 font-medium'
                      : 'truncate text-gray-500'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                /* Clickable breadcrumb link */
                <Link
                  to={item.href}
                  className="truncate text-gray-500 no-underline transition-colors hover:text-teal-600 focus-visible:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-1 rounded-sm"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
