import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth/session";

/**
 * API Routes for Individual Leave Requests
 * PUT: Update leave request (only if status is 'submitted')
 * DELETE: Delete leave request (only if status is 'submitted')
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    // Determine role from profiles table (source of truth)
    const roleCheck = createClient();
    const { data: me } = await roleCheck
      .from('profiles')
      .select('role, active')
      .eq('id', session.user.id)
      .single();
    const userRole = me?.role === 'admin' ? 'admin' : 'employee';
    // Use admin client for admins to bypass RLS; fallback to regular client for employees
    const supabase = userRole === "admin" ? getAdminClient() : createClient();
    const body = await request.json();

    const { type, period_start, period_end, comment } = body;
    const requiresComment = type !== 'vacation';

    // Validate required fields
    if (!type || !period_start || !period_end || (requiresComment && !comment)) {
      return NextResponse.json(
        { error: "Alle Pflichtfelder müssen ausgefüllt werden." },
        { status: 400 }
      );
    }

    // Update leave request
    let query = supabase
      .from('leave_requests')
      .update({
        type,
        period_start,
        period_end,
        comment: requiresComment ? comment : null,
      })
      .eq('id', params.id);

    // Only restrict to 'submitted' for non-admins; admins can edit any status
    if (userRole !== "admin") {
      query = query.eq('status', 'submitted');
    }

    // Employees can only edit their own requests; admins can edit any
    if (userRole !== "admin") {
      query = query.eq('employee_id', session.user.id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      console.error("[LeaveRequests] Error updating request:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren des Antrags." },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const roleCheck = createClient();
    const { data: me } = await roleCheck
      .from('profiles')
      .select('role, active')
      .eq('id', session.user.id)
      .single();
    const userRole = me?.role === 'admin' ? 'admin' : 'employee';
    const supabase = userRole === "admin" ? getAdminClient() : createClient();

    // Delete leave request
    let query = supabase
      .from('leave_requests')
      .delete()
      .eq('id', params.id);

    // Only restrict to 'submitted' for non-admins; admins can delete any status
    if (userRole !== "admin") {
      query = query.eq('status', 'submitted');
    }

    if (userRole !== "admin") {
      query = query.eq('employee_id', session.user.id);
    }

    const { error } = await query;

    if (error) {
      console.error("[LeaveRequests] Error deleting request:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Löschen des Antrags." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LeaveRequests] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
