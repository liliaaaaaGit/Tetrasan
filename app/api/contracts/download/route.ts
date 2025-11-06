import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Downloads the latest contract PDF for an employee from the 'forms-uploads' bucket
// Looks under prefix `contracts/{employeeId}/` and redirects to a signed URL
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    // Admin only
    const { data: me } = await supabase
      .from('profiles')
      .select('id, role, active')
      .eq('id', session.user.id)
      .single();
    if (!me || me.role !== 'admin' || me.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const employeeId = request.nextUrl.searchParams.get('employeeId');
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId ist erforderlich." }, { status: 400 });
    }

    const bucket = supabase.storage.from('forms-uploads');
    const prefix = `contracts/${employeeId}/`;
    const { data: list, error: listError } = await bucket.list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } as any });
    if (listError) {
      console.error('[Contracts] List error:', listError.message);
      return NextResponse.json({ error: 'Fehler beim Finden der Verträge.' }, { status: 500 });
    }

    if (!list || list.length === 0) {
      return NextResponse.json({ error: 'Kein Vertrag gefunden.' }, { status: 404 });
    }

    // Pick the most recent file
    const file = list[0];
    const path = `${prefix}${file.name}`;
    const { data: signed, error: signError } = await bucket.createSignedUrl(path, 60);
    if (signError || !signed?.signedUrl) {
      console.error('[Contracts] Signed URL error:', signError?.message);
      return NextResponse.json({ error: 'Fehler beim Erstellen des Download-Links.' }, { status: 500 });
    }

    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (err) {
    console.error('[Contracts] Unexpected error:', err);
    return NextResponse.json({ error: 'Unerwarteter Fehler.' }, { status: 500 });
  }
}


