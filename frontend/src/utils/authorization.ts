/**
 * ─── Authorization Layer ────────────────────────────────────────────
 *
 * This module provides convenience authorization helpers built on top
 * of the permission system in `permissions.ts`.
 *
 * **Dependency direction:** `authorization.ts` imports `permissions.ts`.
 * `auth.ts` imports `authorization.ts`. NEVER the reverse.
 *
 * **Design principles:**
 * - Synchronous helpers (`isStaff`, `isAdmin`, `canEditDoctors`, etc.)
 *   accept a `UserPublic | null | undefined` parameter and return
 *   `boolean`. They make NO API calls.
 * - Async helpers (`isPatient`) make API calls because patient detection
 *   requires checking the linked Patient record.
 * - The rest of the application should use these helpers instead of
 *   checking `user.role === 'doctor'` directly.
 */

import type { UserPublic } from '@/client';
import { AppointmentsService } from '@/client';
import { can, type Permission } from './permissions';

// ─── Convenience wrappers ───────────────────────────────────────────

/**
 * Is the user a staff member (doctor or admin)?
 *
 * Staff members have access to the staff layout (`_layout`) and its
 * child routes (dashboard, appointments, availability, etc.).
 *
 * This is the PRIMARY gate for the staff layout.
 *
 * @param user The authenticated user (or null/undefined if not loaded).
 * @returns `true` if the user is a doctor or admin.
 */
export function isStaff(user: UserPublic | null | undefined): boolean {
  return can(user, 'appointments:view');
}

/**
 * Is the user a superuser (admin)?
 *
 * Admins have access to the admin panel and doctor management.
 *
 * @param user The authenticated user (or null/undefined).
 * @returns `true` if the user has `is_superuser === true`.
 */
export function isAdmin(user: UserPublic | null | undefined): boolean {
  return can(user, 'admin:panel');
}

/**
 * Does the user have a linked Patient profile?
 *
 * **This is an ASYNC check** because it requires an API call to
 * `GET /api/v1/patients/me`. The result is NOT cached in the
 * `["currentUser"]` query — it's a separate resource.
 *
 * Patient is a medical profile, NOT an authorization role.
 * A Doctor or Admin may also become a patient in the future.
 *
 * @returns `true` if the authenticated user has a linked Patient record.
 */
export async function isPatient(): Promise<boolean> {
  try {
    const patient = await AppointmentsService.readMyPatient();
    return !!patient;
  } catch {
    return false;
  }
}

// ─── Permission-based helpers ───────────────────────────────────────

/**
 * Can the user manage doctors (create, edit, delete)?
 *
 * @returns `true` if the user has the `doctors:manage` permission.
 */
export function canEditDoctors(user: UserPublic | null | undefined): boolean {
  return can(user, 'doctors:manage');
}

/**
 * Can the user manage availability schedules?
 *
 * @returns `true` if the user has the `availability:edit` permission.
 */
export function canManageAvailability(
  user: UserPublic | null | undefined
): boolean {
  return can(user, 'availability:edit');
}

/**
 * Can the user view the admin panel?
 *
 * @returns `true` if the user has the `admin:panel` permission.
 */
export function canViewAdminPanel(
  user: UserPublic | null | undefined
): boolean {
  return can(user, 'admin:panel');
}

/**
 * Generic permission check.
 *
 * Prefer the named helpers above (`isStaff`, `isAdmin`, etc.) for
 * common checks. Use this for ad-hoc or future permissions.
 *
 * @example
 * ```ts
 * if (hasPermission(user, 'appointments:cancel')) { ... }
 * ```
 */
export function hasPermission(
  user: UserPublic | null | undefined,
  permission: Permission
): boolean {
  return can(user, permission);
}
