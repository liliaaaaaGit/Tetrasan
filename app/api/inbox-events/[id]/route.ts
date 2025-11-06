import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/inbox-events/[id]
 * Admin only - deletes one inbox event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use user-scoped client to read session; use admin client for writes
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

    // Soft-delete: fetch payload, set deleted flag, update
    const { data: row, error: fetchErr } = await admin
      .from('inbox_events')
      .select('payload')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchErr) {
      console.error('[InboxEvents] Error loading event for delete:', fetchErr);
      return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
    }

    if (row) {
      // Existing real event → soft-delete
      const currentPayload = (row as any)?.payload || {};
      const newPayload = { ...currentPayload, deleted: true } as any;
      const { error } = await admin
        .from('inbox_events')
        .update({ payload: newPayload })
        .eq('id', params.id);
      if (error) {
        console.error('[InboxEvents] Error soft-deleting event:', error.message);
        return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
      }
    } else {
      // Synthetic row (no inbox_events entry). Create a tombstone event so backfill won't recreate it.
      const { data: req, error: reqErr } = await admin
        .from('leave_requests')
        .select('id, employee_id, type')
        .eq('id', params.id)
        .maybeSingle();
      if (reqErr) {
        console.error('[InboxEvents] Error loading leave_request for tombstone:', reqErr);
        return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
      }
      if (!req) {
        // Nothing to delete; treat as success
        return NextResponse.json({ success: true });
      }
      const { error: insertErr } = await admin
        .from('inbox_events')
        .insert({
          kind: req.type === 'vacation' ? 'leave_request_submitted' : 'day_off_request_submitted',
          payload: { reqId: req.id, employeeId: req.employee_id, deleted: true },
          is_read: true,
        });
      if (insertErr) {
        console.error('[InboxEvents] Error inserting tombstone event:', insertErr);
        return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[InboxEvents] Unexpected error:', err);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 });
  }
}


