import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "employee";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  active: boolean;
  must_change_password?: boolean | null;
  preferred_language: string;
}

/**
 * Get current session (server-side)
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get user profile from profiles table
 * Returns null if not found or inactive
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .eq('active', true)
    .single();

  if (error || !data) {
    console.error("[getProfile] Error fetching profile:", error?.message);
    return null;
  }

  return {
    ...data,
    preferred_language: (data as { preferred_language?: string }).preferred_language ?? "de",
  } as UserProfile;
}

/**
 * Require authenticated session
 * Redirects to login if not authenticated
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Require specific role
 * Redirects to login if not authenticated or wrong role
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireSession();
  const profile = await getProfile(session.user.id);

  if (!profile || !profile.active) {
    // Profile not found or inactive - sign out
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(profile.role)) {
    // Wrong role - redirect to appropriate dashboard
    if (profile.role === "admin") {
      redirect("/admin/employees");
    } else {
      redirect("/employee/hours");
    }
  }

  return { session, profile };
}

