import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

/**
 * API Routes for Leave Requests
 * GET: Fetch leave requests for current user
 * POST: Create new leave request
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Get leave requests for the current user
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[LeaveRequests] Error fetching requests:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Laden der Anträge." },
        { status: 500 }
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }
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

    // Create new leave request
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: session.user.id,
        type,
        period_start,
        period_end,
        comment: requiresComment ? comment : null,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error("[LeaveRequests] Error creating request:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Antrags." },
        { status: 500 }
      );
    }

    // Create inbox event for admin notification
    const { error: inboxError } = await supabase
      .from('inbox_events')
      .insert({
        kind: type === 'vacation' ? 'leave_request_submitted' : 'day_off_request_submitted',
        payload: {
          reqId: data.id,
          employeeId: session.user.id,
        },
        is_read: false,
      });

    if (inboxError) {
      console.error("[LeaveRequests] Error creating inbox event:", inboxError.message);
      // Don't fail the request if inbox event creation fails
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[LeaveRequests] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
