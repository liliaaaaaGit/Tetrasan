import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/password-resets
 * Fetch all open password reset requests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", session.user.id)
      .single();

    if (adminError || !adminProfile || adminProfile.role !== "admin" || !adminProfile.active) {
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
      // Table might not exist yet (migration not run)
      if (
        error.code === "42P01" ||
        error.code === "PGRST116" ||
        error.message?.toLowerCase().includes("does not exist") ||
        error.message?.toLowerCase().includes("not exist")
      ) {
        return NextResponse.json({ data: [] });
      }
      console.error("[PasswordResets] Error fetching requests:", error);
      return NextResponse.json({ data: [], error: "Fehler beim Laden der Reset-Anfragen." });
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
    return NextResponse.json({ data: [], error: "Fehler beim Laden der Reset-Anfragen." });
  }
}

