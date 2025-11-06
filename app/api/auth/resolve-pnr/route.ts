import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve employee internal email by personal number (server-side, admin client)
 * POST { personal_number: string }
 * Response: { email: string | null }
 */
export async function POST(request: NextRequest) {
  try {
    const { personal_number } = await request.json();
    if (!personal_number || !/^\d{5}$/.test(personal_number)) {
      return NextResponse.json({ error: "Ungültige Personalnummer." }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('email')
      .eq('personal_number', personal_number)
      .eq('role', 'employee')
      .eq('active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ email: null }, { status: 200 });
    }

    return NextResponse.json({ email: data.email }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}


