import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateHours } from "@/lib/date-utils";

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

    const {
      date,
      time_from,
      time_to,
      break_minutes,
      status,
      activity_note,
      comment,
      project_name,
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
        if (!trimmedProjectName || !trimmedActivityNote) {
          return NextResponse.json(
            {
              error:
                "Bitte Bauvorhaben und Tätigkeitsbericht ausfüllen, bevor du deine Endzeit speicherst.",
            },
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

    let computedHours = 0;
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

    const timestamp = new Date().toISOString();

    const payload =
      status === "work"
        ? {
            date,
            status,
            time_from: normalizedFrom || null,
            time_to: hasEndTime ? normalizedTo : null,
            break_minutes: breakMinutesValue,
            hours_decimal: computedHours,
            activity_note: hasEndTime && trimmedActivityNote ? trimmedActivityNote : null,
            comment: null,
            project_name: hasEndTime && trimmedProjectName ? trimmedProjectName : null,
            updated_at: timestamp,
          }
        : {
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

    const { data, error } = await supabase
      .from("timesheet_entries")
      .update(payload)
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
