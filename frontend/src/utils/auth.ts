/**
 * ─── Authentication Layer ───────────────────────────────────────────
 *
 * Responsibilities:
 * - `isLoggedIn()`         — check if an access token exists in storage
 * - `resolveDashboardRoute()` — determine the correct landing page
 *                              after successful authentication
 *
 * This module imports from `authorization.ts` for role/patient checks.
 * It does NOT define authorization logic itself.
 *
 * **Dependency direction:**
 * `auth.ts` → `authorization.ts` → `permissions.ts`
 * (one-way, no circular imports)
 */

import { UsersService } from '@/client';
import { isPatient, isStaff } from './authorization';

/**
 * Check whether an access token exists in localStorage.
 *
 * This is a SYNCHRONOUS check — it only verifies token PRESENCE,
 * not token VALIDITY. An expired or invalid token will pass this
 * check but fail on the first authenticated API call.
 *
 * The global API error handler in `main.tsx` catches 401/403
 * responses and redirects to `/login` as a safety net.
 *
 * @returns `true` if `access_token` exists in localStorage.
 */
export function isLoggedIn(): boolean {
  return localStorage.getItem('access_token') !== null;
}

/**
 * Resolve the correct dashboard route for the currently authenticated user.
 *
 * **Purpose:** This function answers ONLY the question:
 * "After successful authentication, which dashboard should this user enter?"
 *
 * It is used in:
 * - `useAuth.ts` — after login mutation succeeds
 * - `login.tsx` — `beforeLoad` guard (redirect already-authenticated users)
 * - `activate-account.tsx` — `beforeLoad` guard and success button
 *
 * **Resolution order:**
 * 1. Admin (is_superuser === true)          → "/dashboard"
 * 2. Has linked Patient profile             → "/patient/dashboard"
 * 3. Doctor (role === "doctor")             → "/dashboard"
 * 4. Fallback                               → "/dashboard"
 *
 * **IMPORTANT:** The Patient check (step 2) MUST come before the role
 * check (step 3) because patient users in the database have
 * `role = "doctor"` (the default from `UserBase`). A Patient is a
 * medical profile, not an authorization role — a Doctor or Admin may
 * also become a patient in the future.
 *
 * This function makes two API calls:
 * 1. `GET /api/v1/users/me`      – to get the user's role and superuser flag
 * 2. `GET /api/v1/patients/me`   – to check if a Patient profile is linked
 *
 * @returns The dashboard route path for the current user.
 */
export async function resolveDashboardRoute(): Promise<string> {
  try {
    const user = await UsersService.readUserMe();

    // 1. Admin → staff dashboard
    if (user.is_superuser) {
      return '/dashboard';
    }

    // 2. Check if the user has a linked Patient record
    //    This must be checked BEFORE role because patient users
    //    have role = "doctor" (the backend default).
    if (await isPatient()) {
      return '/patient/dashboard';
    }

    // 3. Doctor (no linked Patient) → staff dashboard
    if (isStaff(user)) {
      return '/dashboard';
    }

    // 4. Fallback
    return '/dashboard';
  } catch {
    // readUserMe failed → not authenticated or API error
    return '/dashboard';
  }
}
