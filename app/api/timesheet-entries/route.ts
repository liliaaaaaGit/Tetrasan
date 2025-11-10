import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { calculateHours } from "@/lib/date-utils";

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
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      date,
      time_from,
      time_to,
      break_minutes,
      status,
      activity_note,
      comment,
      project_name,
      employee_id,
    } = body;

    const normalizeTimeValue = (value: unknown): string => {
      if (typeof value !== "string") return "";
      const trimmed = value.trim();
      return trimmed.length >= 5 ? trimmed.substring(0, 5) : trimmed;
    };

    const trimmedActivityNote =
      typeof activity_note === "string" ? activity_note.trim() : "";
    const trimmedProjectName =
      typeof project_name === "string" ? project_name.trim() : "";
    const trimmedComment = typeof comment === "string" ? comment.trim() : "";
    const normalizedFrom = normalizeTimeValue(time_from);
    const normalizedTo = normalizeTimeValue(time_to);
    const breakMinutesRaw =
      typeof break_minutes === "number" ? break_minutes : Number(break_minutes ?? 0);
    const breakMinutesValue = Number.isFinite(breakMinutesRaw) ? breakMinutesRaw : 0;
    const hasEndTime = status === "work" && normalizedTo !== "";

    // Determine target employee (admins can create entries for others)
    let targetEmployeeId = session.user.id;
    if (employee_id) {
      const { session: adminSession } = await requireRole("admin");
      if (!adminSession) {
        return NextResponse.json(
          { error: "Nicht autorisiert." },
          { status: 403 }
        );
      }
      targetEmployeeId = employee_id;
    }

    if (!date || !status) {
      return NextResponse.json(
        { error: "Datum und Status sind Pflichtfelder." },
        { status: 400 }
      );
    }

    if (status === "work") {
      if (!normalizedFrom) {
        return NextResponse.json(
          { error: "Please enter a start time." },
          { status: 400 }
        );
      }

      if (breakMinutesValue < 0) {
        return NextResponse.json(
          { error: "Pause darf nicht negativ sein." },
          { status: 400 }
        );
      }

      if (hasEndTime) {
        if (!trimmedProjectName) {
          return NextResponse.json(
            { error: "Please enter a project name." },
            { status: 400 }
          );
        }

        if (!trimmedActivityNote) {
          return NextResponse.json(
            { error: "Please enter a work report." },
            { status: 400 }
          );
        }
      }
    }

    if ((status === "vacation" || status === "sick") && !trimmedComment) {
      return NextResponse.json(
        { error: "Für Urlaub/Krank ist ein Kommentar erforderlich." },
        { status: 400 }
      );
    }

    let computedHours: number | null = null;
    if (status === "work" && hasEndTime) {
      const hoursResult = calculateHours(normalizedFrom, normalizedTo, breakMinutesValue);
      if (hoursResult === null) {
        return NextResponse.json(
          { error: "End time must be after start time." },
          { status: 400 }
        );
      }
      computedHours = hoursResult;
    }

    // Upsert behaviour: update existing entry if present
    const { data: existingEntry, error: checkError } = await supabase
      .from("timesheet_entries")
      .select("id")
      .eq("employee_id", targetEmployeeId)
      .eq("date", date)
      .maybeSingle();

    if (checkError) {
      console.error("[TimesheetEntries] Error checking for existing entry:", checkError);
      return NextResponse.json(
        { error: "Fehler beim Prüfen des Zeiteintrags.", details: checkError.message },
        { status: 500 }
      );
    }

    const timestamp = new Date().toISOString();

    const workUpdatePayload = {
      date,
      status,
      time_from: normalizedFrom || null,
      time_to: hasEndTime ? normalizedTo : null,
      break_minutes: breakMinutesValue,
      hours_decimal: computedHours,
      activity_note: trimmedActivityNote ? trimmedActivityNote : null,
      comment: null,
      project_name: trimmedProjectName ? trimmedProjectName : null,
      updated_at: timestamp,
    };

    const nonWorkUpdatePayload = {
      date,
      status,
      comment: trimmedComment,
      time_from: "00:00",
      time_to: "00:01",
      break_minutes: 0,
      hours_decimal: 0,
      activity_note: null,
      project_name: null,
      updated_at: timestamp,
    };

    let data;
    let error;

    if (existingEntry) {
      const { data: updatedData, error: updateError } = await supabase
        .from("timesheet_entries")
        .update(status === "work" ? workUpdatePayload : nonWorkUpdatePayload)
        .eq("id", existingEntry.id)
        .eq("employee_id", targetEmployeeId)
        .select()
        .single();

      data = updatedData;
      error = updateError;
    } else {
      const insertPayload =
        status === "work"
          ? {
              employee_id: targetEmployeeId,
              ...workUpdatePayload,
            }
          : {
              employee_id: targetEmployeeId,
              ...nonWorkUpdatePayload,
            };

      const { data: insertedData, error: insertError } = await supabase
        .from("timesheet_entries")
        .insert(insertPayload)
        .select()
        .single();

      data = insertedData;
      error = insertError;
    }

    if (error) {
      console.error("[TimesheetEntries] Error saving entry:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern des Zeiteintrags.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: existingEntry ? 200 : 201 });
  } catch (error) {
    console.error("[TimesheetEntries] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
