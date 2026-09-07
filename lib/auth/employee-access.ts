import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Lock or unlock an employee's login as soon as they are archived / reactivated.
 * Admins keep access to archived records; only the employee's own login is blocked.
 */
export async function revokeArchivedEmployeeAccess(userId: string) {
  const admin = getAdminClient();

  const { data: authUser, error: lookupError } = await admin.auth.admin.getUserById(userId);
  if (lookupError || !authUser?.user) {
    // Profile may exist before the employee has ever registered a login.
    return;
  }

  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (banError) {
    console.error("[EmployeeAccess] Error banning archived employee:", banError.message);
  }

  // End all existing sessions so an already-open phone/browser is locked out.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  try {
    const logoutResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}/logout`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );
    if (!logoutResponse.ok && logoutResponse.status !== 404) {
      console.error(
        "[EmployeeAccess] Error logging out archived employee:",
        logoutResponse.status,
        await logoutResponse.text()
      );
    }
  } catch (error) {
    console.error("[EmployeeAccess] Error logging out archived employee:", error);
  }
}

export async function restoreArchivedEmployeeAccess(userId: string) {
  const admin = getAdminClient();

  const { data: authUser, error: lookupError } = await admin.auth.admin.getUserById(userId);
  if (lookupError || !authUser?.user) {
    return;
  }

  const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (unbanError) {
    console.error("[EmployeeAccess] Error restoring employee login:", unbanError.message);
  }
}
