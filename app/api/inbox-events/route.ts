import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Routes for Admin Inbox Events
 * GET: Fetch all inbox events for admin
 * PUT: Mark events as read
 */

export async function GET(request: NextRequest) {
  try {
    // Manual admin check (avoid redirect() in API routes)
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }
    const { data: me } = await supabase
      .from('profiles')
      .select('id, role, active')
      .eq('id', session.user.id)
      .single();
    if (!me || me.role !== 'admin' || me.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    // Load inbox events
    const { data: events, error: eventsError } = await supabase
      .from('inbox_events')
      .select('id, kind, payload, is_read, created_at')
      .order('created_at', { ascending: false });
    if (eventsError) {
      console.error('[InboxEvents] Error fetching events:', eventsError.message);
      return NextResponse.json({ error: 'Fehler beim Laden der Benachrichtigungen.' }, { status: 500 });
    }

    const reqIds = (events || []).map(e => (e as any).payload?.reqId).filter(Boolean);
    const empIdsFromEvents = (events || []).map(e => (e as any).payload?.employeeId).filter(Boolean);

    // Load related leave requests with full details
    let requestsById: Record<string, any> = {};
    if (reqIds.length > 0) {
      const { data: requests, error: reqError } = await supabase
        .from('leave_requests')
        .select('id, type, status, employee_id, period_start, period_end, comment, created_at')
        .in('id', reqIds);
      if (reqError) {
        console.error('[InboxEvents] Error fetching requests:', reqError.message);
      } else {
        requestsById = Object.fromEntries((requests || []).map(r => [r.id, r]));
      }
    }

    // Load related employee profiles
    let employeesById: Record<string, any> = {};
    let empIds = Array.from(new Set(empIdsFromEvents));
    // also include employee ids from related requests (covers events missing employeeId)
    empIds.push(...Object.values(requestsById).map((r: any) => r.employee_id));
    empIds = Array.from(new Set(empIds.filter(Boolean)));
    if (empIds.length > 0) {
      const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', empIds as string[]);
      if (empError) {
        console.error('[InboxEvents] Error fetching profiles:', empError.message);
      } else {
        employeesById = Object.fromEntries((employees || []).map(p => [p.id, p]));
      }
    }

    // Compose response objects tailored for UI
    const data = (events || []).map((e: any) => {
      const reqId = e.payload?.reqId;
      const request = reqId ? requestsById[reqId] : undefined;
      const empId = e.payload?.employeeId || request?.employee_id;
      const employee = empId ? employeesById[empId] : undefined;
      return {
        id: e.id,
        kind: e.kind,
        is_read: e.is_read,
        created_at: e.created_at,
        request: request ? {
          id: request.id,
          type: request.type,
          status: request.status,
          period_start: request.period_start,
          period_end: request.period_end,
          comment: request.comment,
          created_at: request.created_at,
        } : null,
        employee: employee ? { id: employee.id, full_name: employee.full_name, email: employee.email } : null,
      };
    });

    // Backfill: include submitted leave requests that have no inbox event (e.g., legacy rows)
    const existingReqSet = new Set(reqIds);
    const { data: submittedRequests, error: subReqError } = await supabase
      .from('leave_requests')
      .select('id, type, status, employee_id, period_start, period_end, comment, created_at')
      .eq('status', 'submitted')
      .order('created_at', { ascending: false });
    if (!subReqError && submittedRequests) {
      for (const r of submittedRequests) {
        if (!existingReqSet.has(r.id)) {
          const emp = employeesById[r.employee_id];
          data.push({
            id: r.id, // synthetic id
            kind: r.type === 'vacation' ? 'leave_request_submitted' : 'day_off_request_submitted',
            is_read: false,
            created_at: r.created_at,
            request: {
              id: r.id,
              type: r.type,
              status: r.status,
              period_start: r.period_start,
              period_end: r.period_end,
              comment: r.comment,
              created_at: r.created_at,
            },
            employee: emp ? { id: emp.id, full_name: emp.full_name, email: emp.email } : null,
          });
        }
      }
      // Sort again by date desc
      data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Calculate unread count: include both real events and backfilled ones
    const unread = data.filter((e: any) => e.is_read === false).length;
    return NextResponse.json({ data, unread });
  } catch (error) {
    console.error('[InboxEvents] Unexpected error:', error);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Manual admin check
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }
    const { data: me } = await supabase
      .from('profiles')
      .select('id, role, active')
      .eq('id', session.user.id)
      .single();
    if (!me || me.role !== 'admin' || me.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }
    
    
    
    
    const body = await request.json();

    const { eventIds, isRead } = body;

    if (!Array.isArray(eventIds) || typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: "Ungültige Anfrage." },
        { status: 400 }
      );
    }

    // Mark events as read/unread
    const updateData: any = { is_read: isRead };
    if (isRead) {
      updateData.read_at = new Date().toISOString();
    } else {
      updateData.read_at = null;
    }
    
    const { error } = await supabase
      .from('inbox_events')
      .update(updateData)
      .in('id', eventIds);

    if (error) {
      console.error("[InboxEvents] Error updating events:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Benachrichtigungen." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[InboxEvents] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
