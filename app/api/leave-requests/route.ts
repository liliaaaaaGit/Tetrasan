import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requireRole } from "@/lib/auth/session";

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
    if (isAdminCreated && data.status === 'approved') {
      // Import the approval logic (similar to approve route)
      const { getAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = getAdminClient();
      
      // Parse dates and create entries for each day in range
      const start = new Date(period_start);
      const end = new Date(period_end);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const isoDate = formatDateLocal(d);
        const status = type === 'vacation' ? 'vacation' : 'day_off';
        
        // For day_off, parse time from comment if present
        let timeFrom = '00:00';
        let timeTo = '00:01';
        let hoursDecimal = type === 'vacation' ? 0 : 8;
        
        if (type === 'day_off' && comment) {
          // Try to parse time range from comment (e.g., "Zeit: 09:00 - 13:30")
          const timeMatch = comment.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);
          if (timeMatch) {
            timeFrom = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            timeTo = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            // Calculate hours
            const fromHours = parseInt(timeMatch[1], 10);
            const fromMinutes = parseInt(timeMatch[2], 10);
            const toHours = parseInt(timeMatch[3], 10);
            const toMinutes = parseInt(timeMatch[4], 10);
            const totalMinutes = (toHours * 60 + toMinutes) - (fromHours * 60 + fromMinutes);
            hoursDecimal = totalMinutes / 60;
          }
        }

        await adminClient
          .from('timesheet_entries')
          .upsert({
            employee_id: targetEmployeeId,
            date: isoDate,
            status,
            time_from: timeFrom,
            time_to: timeTo,
            break_minutes: 0,
            hours_decimal: hoursDecimal,
            activity_note: null,
            project_name: null,
            comment: type === 'vacation' ? null : comment,
          }, {
            onConflict: 'employee_id,date,status'
          });
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
