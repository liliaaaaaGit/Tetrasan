import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * API Routes for Admin Inbox Events
 * GET: Fetch all inbox events for admin
 * PUT: Mark events as read
 */

export async function GET(request: NextRequest) {
  try {
    // Manual admin check (avoid redirect() in API routes)
    // Use admin client for write ops (later below), read here is fine with user client
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

    // Collect request IDs and employee IDs from various possible payload shapes
    const reqIds = (events || []).map((e: any) => {
      const p = e.payload || {};
      return p.reqId || p.requestId || p.leaveRequestId || null;
    }).filter(Boolean);
    const empIdsFromEvents = (events || []).map((e: any) => {
      const p = e.payload || {};
      return p.employeeId || p.employee_id || null;
    }).filter(Boolean);

    // Load related leave requests with full details
    let requestsById: Record<string, any> = {};
    if (reqIds.length > 0) {
      const { data: requests, error: reqError } = await supabase
        .from('leave_requests')
        .select('id, type, status, employee_id, period_start, period_end, comment, created_at')
        .in('id', reqIds as string[]);
      if (reqError) {
        console.error('[InboxEvents] Error fetching requests:', reqError.message);
      } else {
        requestsById = Object.fromEntries((requests || []).map(r => [r.id, r]));
      }
    }

    // Load related employee profiles (from events and from requests)
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
      // Skip soft-deleted events
      if (e.payload && e.payload.deleted === true) {
        return null;
      }
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
    }).filter(Boolean);

    // Backfill: include submitted leave requests that have no inbox event (e.g., legacy rows)
    // Build a set of all request IDs that already have inbox_events (from the initial query)
    const existingReqSet = new Set(reqIds);
    
    // Also check ALL inbox_events (not just the ones we fetched initially) to catch any newly created ones
    // This ensures we don't backfill requests that have inbox_events created via PUT
    // IMPORTANT: Use admin client to ensure we see ALL events, including ones just created by PUT handler
    // The user client might have RLS restrictions that prevent seeing newly created rows
    const admin = getAdminClient();
    const { data: allInboxEvents } = await admin
      .from('inbox_events')
      .select('id, payload, is_read, created_at')
      .not('payload', 'is', null);
    
    // Build a comprehensive set of all request IDs that have NON-DELETED inbox_events
    // Soft-deleted events should not prevent backfilling (they're hidden from UI)
    const allReqIdsWithEvents = new Set<string>();
    (allInboxEvents || []).forEach((e: any) => {
      // Skip soft-deleted events - they shouldn't prevent backfilling
      if (e.payload && e.payload.deleted === true) {
        return;
      }
      const reqId = e.payload?.reqId;
      if (reqId) {
        allReqIdsWithEvents.add(reqId);
      }
    });
    
    const { data: allRequests, error: subReqError } = await supabase
      .from('leave_requests')
      .select('id, type, status, employee_id, period_start, period_end, comment, created_at')
      .order('created_at', { ascending: false });
    if (!subReqError && allRequests) {
      for (const r of allRequests) {
        // Only backfill if there's NO inbox_event for this request at all
        // Use the comprehensive set that includes all inbox_events
        if (!allReqIdsWithEvents.has(r.id)) {
          const emp = employeesById[r.employee_id];
          data.push({
            id: r.id, // synthetic id
            // keep kind consistent with UI label logic
            kind: r.type === 'vacation' ? 'leave_request_submitted' : 'day_off_request_submitted',
            is_read: false, // New backfilled events are always unread
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
    // Read session with user-scoped client (cookies), do DB writes with admin client
    const userClient = createClient();
    const admin = getAdminClient();
    const { data: { session } } = await userClient.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }
    const { data: me } = await admin
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

    // Check which events exist in inbox_events
    const { data: existingEvents, error: checkError } = await admin
      .from('inbox_events')
      .select('id')
      .in('id', eventIds);

    if (checkError) {
      console.error("[InboxEvents] Error checking events:", checkError.message);
      return NextResponse.json(
        { error: "Fehler beim Prüfen der Benachrichtigungen." },
        { status: 500 }
      );
    }

    const existingIds = new Set((existingEvents || []).map((e: any) => e.id));
    const missingIds = eventIds.filter((id: string) => !existingIds.has(id));

    // Update existing events
    if (existingIds.size > 0) {
      const updateData: any = { is_read: isRead };
      if (isRead) {
        updateData.read_at = new Date().toISOString();
      } else {
        updateData.read_at = null;
      }
      
      const { error: updateError } = await admin
        .from('inbox_events')
        .update(updateData)
        .in('id', Array.from(existingIds));

      if (updateError) {
        console.error("[InboxEvents] Error updating events:", updateError.message);
        return NextResponse.json(
          { error: "Fehler beim Aktualisieren der Benachrichtigungen." },
          { status: 500 }
        );
      }
    }

    // For synthetic events (missing from inbox_events), try to create them from leave_requests
    if (missingIds.length > 0) {
      const { data: requests, error: reqError } = await admin
        .from('leave_requests')
        .select('id, employee_id, type, status, period_start, period_end, comment, created_at')
        .in('id', missingIds);

      if (!reqError && requests && requests.length > 0) {
        const newEvents = requests.map((req: any) => ({
          kind: req.type === 'vacation' ? 'leave_request_submitted' : 'day_off_request_submitted',
          payload: {
            reqId: req.id,
            employeeId: req.employee_id,
          },
          is_read: isRead,
          read_at: isRead ? new Date().toISOString() : null,
        }));

        const { error: insertError } = await admin
          .from('inbox_events')
          .insert(newEvents);

        if (insertError) {
          console.error("[InboxEvents] Error creating synthetic events:", insertError.message);
          // Don't fail the whole request if some events can't be created
        }
      }
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
