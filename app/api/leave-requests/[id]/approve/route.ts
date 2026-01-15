import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/admin";
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
 * Create timesheet entries from an approved leave request
 * - For vacation: creates vacation entries for each day
 * - For day_off: creates day_off entries for each day (full-day)
 */
async function createTimesheetEntriesFromLeaveRequest(
  supabase: SupabaseClient<any>,
  leaveRequest: { id: string; employee_id: string; type: string; period_start: string; period_end: string }
) {
  const { employee_id, type, period_start, period_end } = leaveRequest;
  
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
      // Full-day day_off exemption (8 hours)
      entriesToInsert.push({
        employee_id,
        date,
        status: 'day_off',
        time_from: '00:00',
        time_to: '00:01',
        break_minutes: 0,
        hours_decimal: 8,
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
