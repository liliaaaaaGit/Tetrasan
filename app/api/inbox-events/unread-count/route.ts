import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * API Route: GET /api/inbox-events/unread-count
 * Returns the count of unread inbox events for the authenticated admin
 * Always returns fresh data (no caching)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    // Verify admin role
    const admin = getAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, role, active')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin' || profile.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    // Load inbox events (same logic as main route)
    const { data: events, error: eventsError } = await admin
      .from('inbox_events')
      .select('id, kind, payload, is_read, created_at')
      .order('created_at', { ascending: false });
    
    if (eventsError) {
      console.error('[InboxEvents] Error fetching events:', eventsError.message);
      return NextResponse.json({ error: 'Fehler beim Laden der Benachrichtigungen.' }, { status: 500 });
    }

    // Collect request IDs from events
    const reqIds = (events || []).map((e: any) => {
      const p = e.payload || {};
      return p.reqId || p.requestId || p.leaveRequestId || null;
    }).filter(Boolean);

    // Filter out soft-deleted events and count unread (matching main route logic)
    const validUnreadEvents = (events || []).filter((e: any) => {
      // Skip soft-deleted events
      if (e.payload && e.payload.deleted === true) {
        return false;
      }
      return e.is_read === false;
    });

    // Backfill: include submitted leave requests that have no inbox event (matching main route)
    const existingReqSet = new Set(reqIds);
    const { data: allRequests, error: reqError } = await admin
      .from('leave_requests')
      .select('id, type, status, employee_id, period_start, period_end, comment, created_at')
      .order('created_at', { ascending: false });

    let backfilledUnreadCount = 0;
    if (!reqError && allRequests) {
      for (const r of allRequests) {
        // Only count requests that don't have inbox events (backfilled)
        // These are always considered unread (is_read: false in main route)
        if (!existingReqSet.has(r.id)) {
          backfilledUnreadCount++;
        }
      }
    }

    const totalUnread = validUnreadEvents.length + backfilledUnreadCount;
    
    // Debug logging (can be removed after fixing)
    const debugInfo = {
      totalEvents: events?.length || 0,
      unreadEvents: validUnreadEvents.length,
      backfilledUnread: backfilledUnreadCount,
      totalUnread,
      eventDetails: events?.map((e: any) => ({ 
        id: e.id, 
        is_read: e.is_read, 
        deleted: e.payload?.deleted 
      })) || []
    };
    
    console.log('[UnreadCount] Debug info:', JSON.stringify(debugInfo, null, 2));

    // Return response with no-cache headers to ensure fresh data
    // Include debug info in development to help diagnose issues
    const response = NextResponse.json({ 
      count: totalUnread,
      ...(process.env.NODE_ENV === 'development' ? { debug: debugInfo } : {})
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('[InboxEvents] Unexpected error:', error);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 });
  }
}

