import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/password-resets
 * Fetch all open password reset requests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    const { session } = await requireRole("admin");
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const admin = getAdminClient();

    // Fetch open reset requests
    const { data: requests, error } = await admin
      .from("password_reset_requests")
      .select(`
        id,
        user_id,
        personal_number,
        status,
        created_at,
        processed_at
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ data: [] });
      }
      console.error("[PasswordResets] Error fetching requests:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Reset-Anfragen." },
        { status: 500 }
      );
    }

    // Fetch employee names for each request
    const userIds = (requests || []).map((r: any) => r.user_id);
    let employeeNames: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          employeeNames[p.id] = p.full_name || null;
        });
      }
    }

    // Transform data to include employee name
    const transformedRequests = (requests || []).map((req: any) => ({
      id: req.id,
      user_id: req.user_id,
      personal_number: req.personal_number,
      status: req.status,
      created_at: req.created_at,
      processed_at: req.processed_at,
      employee_name: employeeNames[req.user_id] || null,
    }));

    return NextResponse.json({ data: transformedRequests });
  } catch (error) {
    console.error("[PasswordResets] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

