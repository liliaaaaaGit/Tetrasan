import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/password-resets/[id]/process
 * Process a password reset request by generating a temporary password (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    const { session } = await requireRole("admin");
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const admin = getAdminClient();

    // Fetch the reset request
    const { data: resetRequest, error: fetchError } = await admin
      .from("password_reset_requests")
      .select("id, user_id, personal_number, status")
      .eq("id", params.id)
      .eq("status", "open")
      .single();

    if (fetchError || !resetRequest) {
      return NextResponse.json(
        { error: "Reset-Anfrage nicht gefunden oder bereits bearbeitet." },
        { status: 404 }
      );
    }

    // Generate a secure temporary password (10-12 characters, alphanumeric + special chars)
    const generateTempPassword = (): string => {
      const length = 12;
      const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
      let password = "";
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    };

    const tempPassword = generateTempPassword();

    // Update user password using Supabase Admin API
    const { error: updateError } = await admin.auth.admin.updateUserById(
      resetRequest.user_id,
      {
        password: tempPassword,
      }
    );

    if (updateError) {
      console.error("[PasswordResets] Error updating password:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Setzen des Passworts." },
        { status: 500 }
      );
    }

    // Mark request as done
    const { error: updateRequestError } = await admin
      .from("password_reset_requests")
      .update({
        status: "done",
        processed_at: new Date().toISOString(),
        processed_by: session.user.id,
      })
      .eq("id", params.id);

    if (updateRequestError) {
      console.error("[PasswordResets] Error updating request:", updateRequestError);
      // Password was updated, so we continue even if request update fails
    }

    return NextResponse.json({
      data: {
        tempPassword,
        message: "Passwort erfolgreich zurückgesetzt.",
      },
    });
  } catch (error) {
    console.error("[PasswordResets] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}


