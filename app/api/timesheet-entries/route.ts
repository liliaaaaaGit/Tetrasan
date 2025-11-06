import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requireRole } from "@/lib/auth/session";

/**
 * API Routes for Timesheet Entries
 * GET: Fetch timesheet entries for current user (or specific employee if admin)
 * POST: Create new timesheet entry
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Check if admin is requesting entries for a specific employee
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    
    let targetEmployeeId = session.user.id;
    
    if (employeeId) {
      // Admin access - verify admin role
      const { session: adminSession } = await requireRole('admin');
      if (!adminSession) {
        return NextResponse.json(
          { error: "Nicht autorisiert." },
          { status: 403 }
        );
      }
      targetEmployeeId = employeeId;
    }

    // Get timesheet entries for the target user
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('employee_id', targetEmployeeId)
      .order('date', { ascending: false });

    if (error) {
      console.error("[TimesheetEntries] Error fetching entries:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Zeiteinträge.", details: error.message },
        { status: 500 }
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

export async function POST(request: NextRequest) {
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

    const { date, time_from, time_to, break_minutes, hours_decimal, status, activity_note, comment, employee_id } = body;

    // Determine target employee_id (admin can create for others)
    let targetEmployeeId = session.user.id;
    if (employee_id) {
      // Admin access - verify admin role
      const { session: adminSession } = await requireRole('admin');
      if (!adminSession) {
        return NextResponse.json(
          { error: "Nicht autorisiert." },
          { status: 403 }
        );
      }
      targetEmployeeId = employee_id;
    }

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

    // Create new timesheet entry
    const { data, error } = await supabase
      .from('timesheet_entries')
      .insert({
        employee_id: targetEmployeeId,
        date,
        time_from,
        time_to,
        break_minutes: break_minutes || 0,
        hours_decimal,
        status,
        activity_note,
        comment,
      })
      .select()
      .single();

    if (error) {
      console.error("[TimesheetEntries] Error creating entry:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern des Zeiteintrags.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[TimesheetEntries] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
