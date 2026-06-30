/**
 * ─── Permission Definitions ─────────────────────────────────────────
 *
 * This module defines the canonical permission map for the application.
 *
 * **Architecture:**
 * - Permission-based (NOT role-based).
 * - The rest of the application asks `can(user, permission)` instead of
 *   checking `user.role === 'doctor'` directly.
 * - Adding a new role (e.g. `receptionist`, `nurse`, `accountant`) means
 *   adding it to the `PERMISSIONS` map — no other code changes needed.
 * - Adding a new permission means adding a key to `PERMISSIONS` and
 *   optionally a convenience wrapper in `authorization.ts`.
 *
 * **Current roles:**
 * - `admin`  — system administrator (is_superuser = true)
 * - `doctor` — medical practitioner (role = "doctor")
 *
 * **Future roles (anticipated):**
 * - `receptionist` — front-desk staff
 * - `nurse`        — nursing staff
 * - `accountant`   — billing / financial
 * - `clinic_manager` — multi-clinic supervisor
 *
 * **Patient is NOT a role.**
 * Patient is a medical profile linked to a User record.
 * A Doctor or Admin may also become a patient in the future.
 * Patient detection is handled by `isPatient()` in `authorization.ts`.
 */

import type { UserPublic } from '@/client';

// ─── Permission type ────────────────────────────────────────────────

/**
 * Every known permission in the application.
 * Add new permissions here as the application grows.
 */
export type Permission =
  | 'appointments:view'
  | 'appointments:edit'
  | 'appointments:cancel'
  | 'availability:view'
  | 'availability:edit'
  | 'doctors:manage'
  | 'admin:panel'
  | 'settings:view';

// ─── Permission map ─────────────────────────────────────────────────

/**
 * Maps each role to the set of permissions it grants.
 *
 * **Rules:**
 * - `is_superuser` (admin) implicitly has ALL permissions.
 * - The `can()` function in `authorization.ts` checks `is_superuser`
 *   before consulting this map.
 * - Add new roles as array entries.
 * - Add new permissions as keys.
 */
const PERMISSIONS: Record<Permission, readonly string[]> = {
  // ── Appointments ──────────────────────────────────────────────
  'appointments:view': ['admin', 'doctor'],
  'appointments:edit': ['admin', 'doctor'],
  'appointments:cancel': ['admin', 'doctor'],

  // ── Availability ──────────────────────────────────────────────
  'availability:view': ['admin', 'doctor'],
  'availability:edit': ['admin', 'doctor'],

  // ── Doctors ───────────────────────────────────────────────────
  'doctors:manage': ['admin'],

  // ── Admin ─────────────────────────────────────────────────────
  'admin:panel': ['admin'],

  // ── Settings ──────────────────────────────────────────────────
  'settings:view': ['admin', 'doctor'],
} as const;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Check whether a user has a given permission.
 *
 * - Superusers (is_superuser === true) always return `true`.
 * - Regular users are checked against the `PERMISSIONS` map by role.
 * - Returns `false` for `null`/`undefined` users (not authenticated).
 *
 * @example
 * ```ts
 * if (can(user, 'doctors:manage')) { ... }
 * ```
 */
export function can(
  user: UserPublic | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  if (!user.role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(user.role);
}

/**
 * Return the raw permission map (for introspection / debugging).
 */
export function getPermissionMap(): Record<Permission, readonly string[]> {
  return PERMISSIONS;
}
