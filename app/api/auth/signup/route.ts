import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side signup endpoint
 * 
 * New Flow:
 * 1. Check if email exists in profiles table (created by admin)
 * 2. If exists, create Supabase Auth user
 * 3. Link auth.user.id to existing profiles record
 * 4. If not exists, reject registration
 */

interface SignupRequest {
  email?: string;
  personal_number?: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SignupRequest = await request.json();
    const { email, personal_number, password } = body;

    // Basic validation
    if ((!email && !personal_number) || !password) {
      return NextResponse.json(
        { error: "Bitte Eingaben prüfen." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Password length check
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein." },
        { status: 400 }
      );
    }

    let normalizedEmail = email ? email.toLowerCase().trim() : undefined;

    // If employee signs up with Personalnummer, resolve internal email
    if (!normalizedEmail && personal_number) {
      if (!/^\d{5}$/.test(personal_number)) {
        return NextResponse.json(
          { error: "Bitte 5-stellige Personalnummer eingeben." },
          { status: 400 }
        );
      }
      const adminClient = getAdminClient();
      const { data: p, error: pErr } = await adminClient
        .from('profiles')
        .select('id, email, role, active')
        .eq('personal_number', personal_number)
        .eq('active', true)
        .single();
      if (pErr || !p || p.role !== 'employee') {
        return NextResponse.json(
          { error: "Ihr Konto wurde noch nicht von einem Administrator erstellt. Bitte wenden Sie sich an die Verwaltung." },
          { status: 400 }
        );
      }
      normalizedEmail = p.email;
    }

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Ungültige Personalnummer oder E-Mail." },
        { status: 400 }
      );
    }

    // Check if email exists in profiles table (created by admin)
    // Use admin client to bypass RLS for this check
    const adminClient = getAdminClient();
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, role')
      .eq('email', normalizedEmail)
      .eq('active', true)
      .single();

    console.log("[Signup] Profile lookup:", { profileData, profileError, normalizedEmail });

    if (profileError || !profileData) {
      console.log("[Signup] Profile not found or error:", profileError);
      return NextResponse.json(
        { error: "Ihr Konto wurde noch nicht von einem Administrator erstellt. Bitte wenden Sie sich an die Verwaltung." },
        { status: 400 }
      );
    }

    // Prevent admin self-registration
    if (profileData.role === 'admin') {
      return NextResponse.json(
        { error: "Administratoren können sich nicht selbst registrieren." },
        { status: 400 }
      );
    }

    // Check if user already has an auth account by checking if profile.id exists in auth.users
    const { data: existingAuthUser, error: authCheckError } = await adminClient.auth.admin.getUserById(profileData.id);
    
    // If we get a user back, it means the profile is already linked to an auth account
    if (existingAuthUser?.user) {
      return NextResponse.json(
        { error: "Ein Konto mit dieser E-Mail-Adresse existiert bereits." },
        { status: 400 }
      );
    }

    // Create Supabase Auth user using admin client
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm for testing
    });

    if (authError) {
      console.error("[Signup] Auth error:", authError);
      return NextResponse.json(
        { error: "Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut." },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut." },
        { status: 500 }
      );
    }

    // Update the existing profile to use the new auth user ID
    const { error: linkError } = await adminClient
      .from('profiles')
      .update({ id: authData.user.id })
      .eq('email', normalizedEmail);

    if (linkError) {
      console.error("[Signup] Link error:", linkError);
      return NextResponse.json(
        { error: "Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut." },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json(
      { 
        ok: true, 
        message: "Registrierung erfolgreich! Sie können sich jetzt anmelden.",
        needsEmailConfirmation: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Signup] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    );
  }
}