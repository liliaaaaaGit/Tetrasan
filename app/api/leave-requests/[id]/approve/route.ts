import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/admin";
import { calculateHours } from "@/lib/date-utils";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * API Route for Approving/Rejecting Leave Requests (Admin only)
 * PUT: Approve or reject a leave request
 */

/**
 * Helper function to generate all dates in a range (inclusive)
 * Handles date strings in YYYY-MM-DD format, avoiding timezone issues
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  
  // Parse dates as UTC to avoid timezone shifts
  // Date strings in YYYY-MM-DD format are parsed as UTC midnight
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error("[LeaveRequests] Invalid date range:", { startDate, endDate });
    return [];
  }
  
  if (start > end) {
    console.error("[LeaveRequests] Start date after end date:", { startDate, endDate });
    return [];
  }
  
  // Generate all dates in the range (inclusive)
  const current = new Date(start);
  while (current <= end) {
    // Format as YYYY-MM-DD in UTC
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    
    // Move to next day in UTC
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return dates;
}

/**
 * Try to extract partial day-off times (HH:MM - HH:MM) from the comment text.
 * This is needed because the original day-off request stores the time window
 * only inside the localized comment (e.g. "Zeit: 09:00 - 13:30 ...").
 * We use a language-agnostic regex that only looks for the "HH:MM - HH:MM" part.
 */
function extractDayOffTimesFromComment(
  comment?: string | null
): { from: string; to: string; hours: number } | null {
  if (!comment) return null;

  // Look for a time pattern like "09:00 - 13:30" or "09:00–13:30"
  const match = comment.match(/(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/);
  if (!match) return null;

  const from = match[1];
  const to = match[2];

  const hours = calculateHours(from, to, 0);
  if (hours === null) {
    console.warn("[LeaveRequests] Invalid time window in comment:", { comment, from, to });
    return null;
  }

  return { from, to, hours };
}

/**
 * Create timesheet entries from an approved leave request
 * - For vacation: creates vacation entries for each day
 * - For day_off:
 *    - If a time window can be parsed from the comment, creates partial day-off entries
 *    - Otherwise, creates full-day day_off entries (8h)
 */
export async function createTimesheetEntriesFromLeaveRequest(
  supabase: SupabaseClient<any>,
  leaveRequest: {
    id: string;
    employee_id: string;
    type: string;
    period_start: string;
    period_end: string;
    comment?: string | null;
  }
) {
  const { employee_id, type, period_start, period_end, comment } = leaveRequest;
  
  // Validate required fields
  if (!employee_id || !type || !period_start || !period_end) {
    throw new Error(`Missing required fields: employee_id=${!!employee_id}, type=${!!type}, period_start=${!!period_start}, period_end=${!!period_end}`);
  }
  
  // Validate type
  if (type !== 'vacation' && type !== 'day_off') {
    throw new Error(`Invalid leave request type: ${type}. Expected 'vacation' or 'day_off'`);
  }
  
  // Map leave request type to timesheet status
  const timesheetStatus = type === 'vacation' ? 'vacation' : 'day_off';

  // For day_off requests, try to extract a partial time window from the comment
  const partialDayOffTimes =
    timesheetStatus === "day_off" ? extractDayOffTimesFromComment(comment) : null;
  
  // Generate all dates in the period
  const dates = generateDateRange(period_start, period_end);
  
  if (dates.length === 0) {
    console.warn("[LeaveRequests] No dates generated for period:", { period_start, period_end });
    return;
  }
  
  const timestamp = new Date().toISOString();
  const entriesToInsert = [];
  
  // Check for existing entries to avoid duplicates
  for (const date of dates) {
    // Check if an entry already exists for this date and status
    const { data: existing } = await supabase
      .from('timesheet_entries')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('date', date)
      .eq('status', timesheetStatus)
      .maybeSingle();
    
    // Skip if entry already exists
    if (existing) {
      console.log(`[LeaveRequests] Entry already exists for ${date} with status ${timesheetStatus}, skipping`);
      continue;
    }
    
    // Prepare entry payload based on type
    if (timesheetStatus === 'vacation') {
      entriesToInsert.push({
        employee_id,
        date,
        status: 'vacation',
        time_from: '00:00',
        time_to: '00:01',
        break_minutes: 0,
        hours_decimal: 0,
        comment: null,
        activity_note: null,
        project_name: null,
        updated_at: timestamp,
      });
    } else if (timesheetStatus === 'day_off') {
      const isPartial = !!partialDayOffTimes;

      // If partial times are available, use them; otherwise fall back to full-day (8h)
      const timeFrom = isPartial ? partialDayOffTimes!.from : "00:00";
      const timeTo = isPartial ? partialDayOffTimes!.to : "00:01";
      const hoursDecimal = isPartial ? partialDayOffTimes!.hours : 8;

      entriesToInsert.push({
        employee_id,
        date,
        status: 'day_off',
        time_from: timeFrom,
        time_to: timeTo,
        break_minutes: 0,
        hours_decimal: hoursDecimal,
        comment: null,
        activity_note: null,
        project_name: null,
        updated_at: timestamp,
      });
    }
  }
  
  // Insert all entries in a single batch
  if (entriesToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('timesheet_entries')
      .insert(entriesToInsert);
    
    if (insertError) {
      console.error("[LeaveRequests] Error inserting timesheet entries:", insertError);
      throw new Error(`Failed to create timesheet entries: ${insertError.message}`);
    }
    
    console.log(`[LeaveRequests] Created ${entriesToInsert.length} timesheet entries for approved ${type} request`);
  } else {
    console.log(`[LeaveRequests] All entries already exist for this period, no new entries created`);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { session } = await requireRole('admin');
    // Use admin client to bypass RLS for admin operations
    const supabase = getAdminClient();
    const body = await request.json();

    const { status } = body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Ungültiger Status. Erlaubt: 'approved' oder 'rejected'." },
        { status: 400 }
      );
    }

    // Handle params - support both sync and async params (Next.js 15)
    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID fehlt." },
        { status: 400 }
      );
    }

    console.log("[LeaveRequests] Updating request:", { requestId, status });

    // Update leave request status
    const updateData: { status: string; updated_at?: string } = { status };
    // Only add updated_at if the column exists (some schemas use triggers)
    const { data, error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('status', 'submitted') // Only allow updates if still submitted
      .select()
      .single();

    if (error) {
      console.error("[LeaveRequests] Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: `Fehler beim Aktualisieren des Antrags: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Antrag nicht gefunden oder bereits bearbeitet." },
        { status: 404 }
      );
    }

    // If approved, automatically create timesheet entries for the period
    if (status === 'approved') {
      try {
        await createTimesheetEntriesFromLeaveRequest(supabase, data);
      } catch (entryError) {
        console.error("[LeaveRequests] Error creating timesheet entries:", entryError);
        // Rollback the approval status if entry creation fails
        await supabase
          .from('leave_requests')
          .update({ status: 'submitted' })
          .eq('id', requestId);
        
        return NextResponse.json(
          { 
            error: `Fehler beim Erstellen der Zeiteinträge: ${entryError instanceof Error ? entryError.message : 'Unbekannter Fehler'}` 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[LeaveRequests] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
