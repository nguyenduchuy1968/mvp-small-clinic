/**
 * Shared date formatting utilities.
 *
 * All user-facing date displays should use these helpers to ensure
 * consistent locale-aware formatting across the application.
 *
 * Backend stores dates in YYYY-MM-DD format — this is never changed.
 * Only UI display formatting is handled here.
 */

/**
 * Format a date string (YYYY-MM-DD) for display according to the given locale.
 *
 * Locale → Format   → Example
 * uk     → DD.MM.YYYY → 22.06.2026
 * vi     → DD/MM/YYYY → 22/06/2026
 * en     → DD/MM/YYYY → 22/06/2026
 *
 * Falls back to en format (DD/MM/YYYY) for unknown locales.
 *
 * @param dateStr - Date string in YYYY-MM-DD format (backend format).
 * @param locale - i18next language code ('en', 'vi', 'uk').
 * @returns Formatted date string for display.
 */
export function formatDateForDisplay(dateStr: string, locale: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateStr;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (locale) {
      case 'uk':
        return `${day}.${month}.${year}`;
      case 'vi':
        return `${day}/${month}/${year}`;
      case 'en':
      default:
        return `${day}/${month}/${year}`;
    }
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string (YYYY-MM-DD) to a long, human-readable form
 * using the given locale.
 *
 * Examples:
 *   en → "22 June 2026"
 *   vi → "22 tháng 6, 2026"
 *   uk → "22 червня 2026"
 *
 * @param dateStr - Date string in YYYY-MM-DD format.
 * @param locale - i18next language code.
 * @returns Human-readable date string.
 */
export function formatDateLong(dateStr: string, locale: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateStr;

    const localeMap: Record<string, string> = {
      en: 'en-GB',
      vi: 'vi-VN',
      uk: 'uk-UA',
    };

    return date.toLocaleDateString(localeMap[locale] || 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
