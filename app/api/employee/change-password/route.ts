import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await requireSession();
    const adminClient = getAdminClient();
    const nowIso = new Date().toISOString();

    const { error } = await adminClient
      .from("profiles")
      .update({ must_change_password: false, updated_at: nowIso })
      .eq("id", session.user.id);

    if (error) {
      console.error("[EmployeeChangePassword] Fehler beim Aktualisieren des Profils:", error.message);
      return NextResponse.json({ error: "Profil konnte nicht aktualisiert werden." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EmployeeChangePassword] Unexpected error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

