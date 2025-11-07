import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ResetPasswordBody {
  userId?: string;
  profileId?: string;
  personalNumber?: string;
}

function generateTempPassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;

  const pick = (source: string) => source.charAt(randomInt(0, source.length));
  const passwordChars = [pick(upper), pick(lower), pick(digits), pick(symbols)];

  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(pick(all));
  }

  // Shuffle to avoid predictable order
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const supabase = createClient();

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", session.user.id)
      .single();

    if (adminProfileError || !adminProfile || adminProfile.role !== "admin" || !adminProfile.active) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const body = (await request.json()) as ResetPasswordBody;

    const adminClient = getAdminClient();

    let targetProfile: { id: string; personal_number: string | null; role: string } | null = null;

    if (body?.userId || body?.profileId) {
      const targetId = body.userId || body.profileId;
      const { data, error } = await adminClient
        .from("profiles")
        .select("id, personal_number, role")
        .eq("id", targetId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[ResetPassword] Fehler beim Laden des Profils (id):", error.message);
      }
      targetProfile = data ?? null;
    } else if (body?.personalNumber) {
      const { data, error } = await adminClient
        .from("profiles")
        .select("id, personal_number, role")
        .eq("personal_number", body.personalNumber)
        .eq("role", "employee")
        .eq("active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("[ResetPassword] Fehler beim Laden des Profils (personal_number):", error.message);
      }
      targetProfile = data ?? null;
    }

    if (!targetProfile) {
      if (!body?.userId && !body?.profileId && !body?.personalNumber) {
        return NextResponse.json({ error: "Es muss eine Personalnummer oder User-ID angegeben werden." }, { status: 400 });
      }
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden." }, { status: 404 });
    }

    if (targetProfile.role !== "employee") {
      return NextResponse.json({ error: "Passwort-Reset ist nur für Mitarbeiter möglich." }, { status: 400 });
    }

    if (!targetProfile.personal_number) {
      return NextResponse.json({ error: "Personalnummer fehlt. Bitte zuerst im Profil hinterlegen." }, { status: 400 });
    }

    const tempPassword = generateTempPassword();

    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetProfile.id, {
      password: tempPassword,
    });

    if (updateError) {
      console.error("[ResetPassword] Fehler beim Setzen des Passworts:", updateError.message);
      return NextResponse.json({ error: "Passwort konnte nicht gesetzt werden." }, { status: 500 });
    }

    // Mark profile to force password change on next login
    const nowIso = new Date().toISOString();
    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({ must_change_password: true, updated_at: nowIso })
      .eq("id", targetProfile.id);

    if (profileUpdateError) {
      console.error("[ResetPassword] Fehler beim Aktualisieren des Profils:", profileUpdateError.message);
    }

    // Close open reset requests for this user and record audit entry
    const { error: closeOpenError } = await adminClient
      .from("password_reset_requests")
      .update({
        status: "done",
        processed_at: nowIso,
        processed_by: session.user.id,
      })
      .eq("user_id", targetProfile.id)
      .eq("status", "open");

    if (closeOpenError) {
      console.error("[ResetPassword] Fehler beim Aktualisieren vorhandener Reset-Anfragen:", closeOpenError.message);
    }

    const { error: insertAuditError } = await adminClient
      .from("password_reset_requests")
      .insert({
        user_id: targetProfile.id,
        personal_number: targetProfile.personal_number,
        status: "done",
        processed_at: nowIso,
        processed_by: session.user.id,
      });

    if (insertAuditError) {
      console.error("[ResetPassword] Fehler beim Schreiben des Audit-Eintrags:", insertAuditError.message);
    }

    return NextResponse.json({ tempPassword });
  } catch (error) {
    console.error("[ResetPassword] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

