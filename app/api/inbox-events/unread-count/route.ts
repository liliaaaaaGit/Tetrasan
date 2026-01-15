import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * API Route: GET /api/inbox-events/unread-count
 * Returns the count of unread inbox events for the authenticated admin
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

    // Count unread inbox events
    const { count, error: countError } = await admin
      .from('inbox_events')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (countError) {
      console.error('[InboxEvents] Error counting unread events:', countError);
      return NextResponse.json({ error: 'Fehler beim Zählen der ungelesenen Nachrichten.' }, { status: 500 });
    }

    // Also check for backfilled events (leave_requests without inbox_events)
    // This matches the logic in the main inbox-events route
    const { data: allRequests, error: reqError } = await admin
      .from('leave_requests')
      .select('id')
      .order('created_at', { ascending: false });

    let backfilledUnreadCount = 0;
    if (!reqError && allRequests && allRequests.length > 0) {
      // Get all existing inbox event reqIds
      const { data: existingEvents } = await admin
        .from('inbox_events')
        .select('payload')
        .not('payload', 'is', null);

      const existingReqIds = new Set(
        (existingEvents || [])
          .map((e: any) => e.payload?.reqId)
          .filter(Boolean)
      );

      // Count requests that don't have inbox events (these are considered unread)
      backfilledUnreadCount = allRequests.filter((r: any) => !existingReqIds.has(r.id)).length;
    }

    const totalUnread = (count || 0) + backfilledUnreadCount;

    return NextResponse.json({ count: totalUnread });
  } catch (error) {
    console.error('[InboxEvents] Unexpected error:', error);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 });
  }
}

