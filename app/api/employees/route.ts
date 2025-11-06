import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";

/**
 * API Routes for Employee Management (Admin only)
 * GET: Fetch all employees
 * POST: Create new employee
 */

export async function GET(request: NextRequest) {
  try {
    const { session } = await requireRole('admin');
    const supabase = createClient();

    // Get all active employees
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .eq('active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error("[Employees] Error fetching employees:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Laden der Mitarbeiter." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Employees] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireRole('admin');
    const supabase = createClient();
    const admin = getAdminClient();
    const body = await request.json();

    const { personal_number, full_name, phone, active } = body;

    // Validate required fields
    if (!full_name || !/^\d{5}$/.test(personal_number)) {
      return NextResponse.json(
        { error: "Personalnummer (5-stellig) und Name sind erforderlich." },
        { status: 400 }
      );
    }

    // Generate internal email for auth
    const internalEmail = `employee_${personal_number}@tetrasan-intern.local`;

    // Check uniqueness of personal_number
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('personal_number', personal_number)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Personalnummer bereits vergeben.' }, { status: 409 });
    }

    // Create profile placeholder (auth user will be created by employee during registration)
    const { data, error } = await admin
      .from('profiles')
      .insert({
        email: internalEmail,
        full_name,
        phone,
        role: 'employee',
        active: active !== false,
        personal_number,
      })
      .select()
      .single();

    if (error) {
      console.error("[Employees] Error creating employee:", error.message, error.details || "");
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Mitarbeiters." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[Employees] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
