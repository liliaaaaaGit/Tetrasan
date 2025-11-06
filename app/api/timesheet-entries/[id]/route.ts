import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

/**
 * API Routes for Individual Timesheet Entries
 * PUT: Update timesheet entry
 * DELETE: Delete timesheet entry
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }
    const body = await request.json();

    const { date, time_from, time_to, break_minutes, hours_decimal, status, activity_note, comment } = body;

    // Validate required fields based on status
    if (!date || !status) {
      return NextResponse.json(
        { error: "Datum und Status sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // For work status, time fields are required
    if (status === 'work' && (!time_from || !time_to || hours_decimal === undefined)) {
      return NextResponse.json(
        { error: "Für Arbeit sind Zeitangaben erforderlich." },
        { status: 400 }
      );
    }

    // For vacation/sick status, comment is required
    if ((status === 'vacation' || status === 'sick') && !comment) {
      return NextResponse.json(
        { error: "Für Urlaub/Krank ist ein Kommentar erforderlich." },
        { status: 400 }
      );
    }

    // For work status, activity note is required
    if (status === 'work' && !activity_note) {
      return NextResponse.json(
        { error: "Für Arbeit ist ein Tätigkeitsbericht erforderlich." },
        { status: 400 }
      );
    }

    // Update timesheet entry (RLS will ensure user can only update their own entries)
    const { data, error } = await supabase
      .from('timesheet_entries')
      .update({
        date,
        time_from,
        time_to,
        break_minutes: break_minutes || 0,
        hours_decimal,
        status,
        activity_note,
        comment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('employee_id', session.user.id) // Ensure user can only update their own entries
      .select()
      .single();

    if (error) {
      console.error("[TimesheetEntries] Error updating entry:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren des Zeiteintrags." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Zeiteintrag nicht gefunden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[TimesheetEntries] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Delete timesheet entry (RLS will ensure user can only delete their own entries)
    const { error } = await supabase
      .from('timesheet_entries')
      .delete()
      .eq('id', params.id)
      .eq('employee_id', session.user.id); // Ensure user can only delete their own entries

    if (error) {
      console.error("[TimesheetEntries] Error deleting entry:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Löschen des Zeiteintrags." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TimesheetEntries] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
