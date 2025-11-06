import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client with service role key
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * This client has full database access and bypasses RLS.
 * ONLY use in server-side code (API routes, Server Actions).
 * NEVER import this in Client Components or expose to browser.
 */

// Ensure we're on the server
if (typeof window !== "undefined") {
  throw new Error(
    "❌ SECURITY ERROR: Admin client cannot be used on the client side!"
  );
}

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Get admin Supabase client (service role)
 * Use sparingly and only for admin operations like:
 * - Checking allow-list
 * - Creating users
 * - Admin data access
 */
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

