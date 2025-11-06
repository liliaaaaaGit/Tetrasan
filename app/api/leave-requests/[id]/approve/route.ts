import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * API Route for Approving/Rejecting Leave Requests (Admin only)
 * PUT: Approve or reject a leave request
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { session } = await requireRole('admin');
    // Use admin client to bypass RLS for admin operations
    const supabase = getAdminClient();
    const body = await request.json();

    const { status } = body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Ungültiger Status. Erlaubt: 'approved' oder 'rejected'." },
        { status: 400 }
      );
    }

    // Handle params - support both sync and async params (Next.js 15)
    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID fehlt." },
        { status: 400 }
      );
    }

    console.log("[LeaveRequests] Updating request:", { requestId, status });

    // Update leave request status
    const updateData: { status: string; updated_at?: string } = { status };
    // Only add updated_at if the column exists (some schemas use triggers)
    const { data, error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('status', 'submitted') // Only allow updates if still submitted
      .select()
      .single();

    if (error) {
      console.error("[LeaveRequests] Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: `Fehler beim Aktualisieren des Antrags: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Antrag nicht gefunden oder bereits bearbeitet." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[LeaveRequests] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
