import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requireRole } from "@/lib/auth/session";
import { createTimesheetEntriesFromLeaveRequest } from "./[id]/approve/route";

/**
 * API Routes for Leave Requests
 * GET: Fetch leave requests for current user (or specific employee if admin)
 * POST: Create new leave request (admins can create for any employee)
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

    // Check if admin is requesting requests for a specific employee
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    
    let targetEmployeeId = session.user.id;
    
    if (employeeId) {
      // Admin access - verify admin role
      const { session: adminSession } = await requireRole('admin');
      if (!adminSession) {
        return NextResponse.json(
          { error: "Nicht autorisiert." },
          { status: 403 }
        );
      }
      targetEmployeeId = employeeId;
    }

    // Get leave requests for the target user
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', targetEmployeeId)
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

    const { type, period_start, period_end, comment, employee_id } = body;
    const requiresComment = type !== 'vacation';

    // Validate required fields
    if (!type || !period_start || !period_end || (requiresComment && !comment)) {
      return NextResponse.json(
        { error: "Alle Pflichtfelder müssen ausgefüllt werden." },
        { status: 400 }
      );
    }

    // Determine target employee (admins can create for others)
    let targetEmployeeId = session.user.id;
    let isAdminCreated = false;
    
    if (employee_id) {
      // Admin access - verify admin role
      const { session: adminSession } = await requireRole('admin');
      if (!adminSession) {
        return NextResponse.json(
          { error: "Nicht autorisiert." },
          { status: 403 }
        );
      }
      targetEmployeeId = employee_id;
      isAdminCreated = true;
    }

    // Create new leave request
    // Admin-created requests are immediately approved; employee-created are submitted
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: targetEmployeeId,
        type,
        period_start,
        period_end,
        comment: requiresComment ? comment : null,
        status: isAdminCreated ? 'approved' : 'submitted',
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

    // If admin-created and approved, automatically create timesheet entries
    // Use the same helper function as the approval route to ensure consistency
    if (isAdminCreated && data.status === 'approved') {
      try {
        const { getAdminClient } = await import("@/lib/supabase/admin");
        const adminClient = getAdminClient();
        
        // Use the same helper function as the approval route
        // This ensures we use the exact same logic that works for employee-created approved requests
        await createTimesheetEntriesFromLeaveRequest(adminClient, {
          id: data.id,
          employee_id: targetEmployeeId,
          type,
          period_start,
          period_end,
          comment: requiresComment ? comment : null,
        });
        
        console.log(`[LeaveRequests] Created timesheet entries for admin-created ${type} request ${data.id}`);
      } catch (entryError) {
        console.error("[LeaveRequests] Error creating timesheet entries for admin-created request:", entryError);
        // Don't fail the request creation if entry creation fails, but log it
        // The request is still created and can be manually approved later if needed
      }
    } else {
      // Create inbox event for admin notification (only for employee-created requests)
      const { error: inboxError } = await supabase
        .from('inbox_events')
        .insert({
          kind: type === 'vacation' ? 'leave_request_submitted' : 'day_off_request_submitted',
          payload: {
            reqId: data.id,
            employeeId: targetEmployeeId,
          },
          is_read: false,
        });

      if (inboxError) {
        console.error("[LeaveRequests] Error creating inbox event:", inboxError.message);
        // Don't fail the request if inbox event creation fails
      }
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
