import { AppointmentsService, UsersService } from '@/client';

/**
 * Resolve the correct dashboard route for the currently authenticated user.
 *
 * Resolution order:
 * 1. Admin (is_superuser === true)          → "/dashboard"
 * 2. Has linked Patient profile             → "/patient/dashboard"
 * 3. Doctor (role === "doctor")             → "/dashboard"
 * 4. Fallback                               → "/dashboard"
 *
 * IMPORTANT: The Patient check (step 2) MUST come before the role check
 * (step 3) because patient users in the database have role = "doctor"
 * (the default from UserBase). A Patient is a medical profile, not an
 * authorization role — a Doctor or Admin may also become a patient in
 * the future.
 *
 * This function makes two API calls:
 * 1. GET /api/v1/users/me      – to get the user's role and superuser flag
 * 2. GET /api/v1/patients/me   – to check if a Patient profile is linked
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
    try {
      const patient = await AppointmentsService.readMyPatient();
      if (patient) {
        return '/patient/dashboard';
      }
    } catch {
      // readMyPatient failed → not a patient
    }

    // 3. Doctor (no linked Patient) → staff dashboard
    if (user.role === 'doctor') {
      return '/dashboard';
    }

    // 4. Fallback
    return '/dashboard';
  } catch {
    // readUserMe failed → not authenticated or API error
    return '/dashboard';
  }
}
