import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/inbox-events/[id]
 * Admin only - deletes one inbox event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { error } = await supabase
      .from('inbox_events')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('[InboxEvents] Error deleting event:', error.message);
      return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[InboxEvents] Unexpected error:', err);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 });
  }
}


