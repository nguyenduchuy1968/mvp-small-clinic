import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

/**
 * Reverse mapping: Vietnamese specialty names → English lookup keys.
 *
 * The backend may store specialties in any language (e.g. "bs nội khoa"
 * instead of "Internal Medicine"). This map normalises Vietnamese names
 * to their English key so the i18n lookup always finds a match regardless
 * of what language the raw value was stored in.
 */
const VI_TO_EN_KEY: Record<string, string> = {
  'bs_nội_khoa': 'internal_medicine',
  'bác_sĩ_nội_khoa': 'internal_medicine',
  'nội_khoa': 'internal_medicine',
  'tim_mạch': 'cardiology',
  'bs_tim_mạch': 'cardiology',
  'nhi_khoa': 'pediatrics',
  'bs_nhi': 'pediatrics',
  'thần_kinh': 'neurology',
  'bs_thần_kinh': 'neurology',
  'trị_liệu': 'therapist',
  'bs_trị_liệu': 'therapist',
  'da_liễu': 'dermatology',
  'bs_da_liễu': 'dermatology',
  'khám_tổng_quát': 'general_consultation',
  'chăm_sóc_dự_phòng': 'preventive_care',
  'chấn_thương_chỉnh_hình': 'orthopedics',
  'nhãn_khoa': 'ophthalmology',
  'bs_mắt': 'ophthalmology',
  'tai_mũi_họng': 'ent',
  'bs_tai_mũi_họng': 'ent',
  'tiêu_hóa': 'gastroenterology',
  'nội_tiết': 'endocrinology',
  'tâm_thần': 'psychiatry',
  'chẩn_đoán_hình_ảnh': 'radiology',
  'gây_mê_hồi_sức': 'anesthesiology',
  'cấp_cứu': 'emergency_medicine',
  'y_học_gia_đình': 'family_medicine',
  'ngoại_khoa': 'surgery',
  'bs_ngoại_khoa': 'surgery',
  'tiết_niệu': 'urology',
};

/**
 * Normalizes a raw specialty string from the backend into a lookup key.
 *
 * - Trims whitespace
 * - Lowercases
 * - Replaces spaces with underscores
 * - Checks the VI→EN reverse mapping for Vietnamese input
 *
 * Examples:
 *   "Cardiology"         → "cardiology"
 *   "Internal Medicine"  → "internal_medicine"
 *   "  NEUROLOGY  "      → "neurology"
 *   "bs nội khoa"        → "internal_medicine"   (via VI→EN map)
 *   "Nội khoa"           → "internal_medicine"   (via VI→EN map)
 */
function normalizeSpecialty(specialty: string): string {
  const normalized = specialty.trim().toLowerCase().replace(/\s+/g, '_');
  // Check reverse mapping first
  return VI_TO_EN_KEY[normalized] ?? normalized;
}

/**
 * Pure function: maps a raw specialty string to a localized translation
 * using an already-acquired `t` function.
 *
 * Use this inside `.map()` callbacks or other contexts where calling a
 * React hook would violate the Rules of Hooks.
 *
 * ---
 * **Usage:**
 * ```tsx
 * const { t } = useTranslation('booking');
 * // ...
 * items.map(item => localizeSpecialty(item.specialty, t))
 * ```
 *
 * @param specialty - Raw specialty string from the backend (nullable)
 * @param t - An i18next `t` function (e.g. from `useTranslation('booking')`)
 * @returns Localized specialty string, or the raw value as fallback
 */
export function localizeSpecialty(
  specialty: string | null | undefined,
  t: TFunction
): string | null {
  if (!specialty) return null;

  const key = normalizeSpecialty(specialty);

  // Attempt to look up the translation; if the key doesn't exist,
  // i18next returns the key itself — so we check for that.
  const translated = t(`specialties.${key}`, { defaultValue: '__NOT_FOUND__' });

  if (translated === '__NOT_FOUND__') {
    // Fallback: return the raw specialty string as-is
    return specialty;
  }

  return translated;
}

/**
 * React hook: maps a raw doctor specialty string (from the backend API)
 * to a localized, human-readable translation using i18n.
 *
 * If no translation key exists for the given specialty, the raw value
 * is returned as a fallback — ensuring unknown specialties are still
 * displayed rather than silently hidden.
 *
 * ---
 * **Usage:**
 * ```tsx
 * const localizedSpecialty = useLocalizedSpecialty(doctor.specialty);
 * ```
 *
 * @param specialty - Raw specialty string from the backend (nullable)
 * @returns Localized specialty string, or the raw value as fallback
 */
export function useLocalizedSpecialty(
  specialty: string | null | undefined
): string | null {
  const { t } = useTranslation('booking');
  return localizeSpecialty(specialty, t);
}
