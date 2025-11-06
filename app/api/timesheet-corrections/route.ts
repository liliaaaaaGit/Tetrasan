import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

/**
 * API Routes for Timesheet Corrections (Admin only)
 * GET: Fetch corrections for entries
 * POST: Create new correction
 */

export async function GET(request: NextRequest) {
  try {
    // Admin only
    const { session } = await requireRole('admin');
    if (!session) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "employeeId, startDate und endDate sind erforderlich." },
        { status: 400 }
      );
    }

    // Get entries for the employee in the date range
    const { data: entries, error: entriesError } = await supabase
      .from('timesheet_entries')
      .select('id')
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (entriesError) {
      console.error("[Corrections] Error fetching entries:", entriesError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Einträge." },
        { status: 500 }
      );
    }

    const entryIds = entries?.map(e => e.id) || [];

    if (entryIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get corrections for these entries
    const { data, error } = await supabase
      .from('timesheet_corrections')
      .select(`
        *,
        admin:profiles!timesheet_corrections_admin_id_fkey(full_name, email)
      `)
      .in('entry_id', entryIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[Corrections] Error fetching corrections:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Korrekturen." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("[Corrections] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin only
    const { session } = await requireRole('admin');
    if (!session) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const body = await request.json();

    const { entry_id, corrected_time_from, corrected_time_to, corrected_break_minutes, corrected_hours_decimal, note } = body;

    if (!entry_id) {
      return NextResponse.json(
        { error: "entry_id ist erforderlich." },
        { status: 400 }
      );
    }

    // Verify entry exists
    const { data: entry, error: entryError } = await supabase
      .from('timesheet_entries')
      .select('id, employee_id')
      .eq('id', entry_id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: "Eintrag nicht gefunden." },
        { status: 404 }
      );
    }

    // Create correction
    const { data, error } = await supabase
      .from('timesheet_corrections')
      .insert({
        entry_id,
        admin_id: session.user.id,
        corrected_time_from,
        corrected_time_to,
        corrected_break_minutes,
        corrected_hours_decimal,
        note,
      })
      .select()
      .single();

    if (error) {
      console.error("[Corrections] Error creating correction:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern der Korrektur.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[Corrections] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

