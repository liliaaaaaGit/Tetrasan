import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { calculateHours, isSunday, isBlockedDay } from "@/lib/date-utils";
import { getHolidaysForMonth } from "@/lib/data/holidays";

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
    const hasEndTime =
      (status === "work" || status === "day_off") && normalizedTo !== "";

    if (!date || !status) {
      return NextResponse.json(
        { error: "Datum und Status sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // Block entries on blocked days (Sundays and weekday holidays)
    // Fetch holidays for the date's month to check if it's a weekday holiday
    const dateObj = new Date(date + 'T00:00:00Z');
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const holidaysArray = await getHolidaysForMonth(year, month);
    const holidaysSet = new Set(holidaysArray.map(h => h.dateISO));
    
    if (isBlockedDay(date, holidaysSet)) {
      if (isSunday(date)) {
        return NextResponse.json(
          { error: "Sonntage sind immer frei; Einträge sind nicht erlaubt." },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "An Feiertagen können keine Einträge erstellt werden." },
          { status: 400 }
        );
      }
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

    if (status === "day_off") {
      // Day-off exemption:
      // - full-day allowed (no end time)
      // - partial-day allowed (time range, no break)
      if (hasEndTime) {
        const hoursResult = calculateHours(normalizedFrom, normalizedTo, 0);
        if (hoursResult === null) {
          return NextResponse.json(
            { error: "End time must be after start time." },
            { status: 400 }
          );
        }
      }
    }

    if (status === "sick" && !trimmedComment) {
      return NextResponse.json(
        { error: "Für Krank-Tage ist ein Kommentar erforderlich." },
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

    if (status === "day_off") {
      if (hasEndTime) {
        computedHours = calculateHours(normalizedFrom, normalizedTo, 0) ?? 0;
      } else {
        computedHours = 8;
      }
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
        : status === "day_off"
          ? {
              date,
              status,
              time_from: hasEndTime ? normalizedFrom : "00:00",
              time_to: hasEndTime ? normalizedTo : "00:01",
              break_minutes: 0,
              hours_decimal: computedHours,
              activity_note: null,
              comment: null,
              project_name: null,
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', session.user.id)
      .single();
    
    const isAdmin = profile?.role === 'admin' && profile?.active === true;
    
    // Use admin client for admins to bypass RLS; regular client for employees
    const client = isAdmin ? getAdminClient() : supabase;
    
    // Build delete query
    let deleteQuery = client
      .from('timesheet_entries')
      .delete()
      .eq('id', params.id);
    
    // Only restrict to own entries for non-admins
    if (!isAdmin) {
      deleteQuery = deleteQuery.eq('employee_id', session.user.id);
    }

    const { error } = await deleteQuery;

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
