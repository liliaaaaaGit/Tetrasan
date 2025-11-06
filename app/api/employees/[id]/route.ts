import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";

/**
 * API Routes for Individual Employee Management (Admin only)
 * GET: Fetch employee details with timesheet entries and leave requests
 * PUT: Update employee profile
 * DELETE: Deactivate employee
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session } = await requireRole('admin');
    const supabase = createClient();

    // Get employee profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .eq('role', 'employee')
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden." },
        { status: 404 }
      );
    }

    // Get employee's timesheet entries
    const { data: timesheetEntries, error: timesheetError } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('employee_id', params.id)
      .order('date', { ascending: false });

    if (timesheetError) {
      console.error("[Employees] Error fetching timesheet entries:", timesheetError.message);
    }

    // Get employee's leave requests
    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', params.id)
      .order('created_at', { ascending: false });

    if (leaveError) {
      console.error("[Employees] Error fetching leave requests:", leaveError.message);
    }

    return NextResponse.json({
      data: {
        profile,
        timesheetEntries: timesheetEntries || [],
        leaveRequests: leaveRequests || [],
      }
    });
  } catch (error) {
    console.error("[Employees] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session } = await requireRole('admin');
    const supabase = createClient();
    const body = await request.json();

    const { full_name, phone, active } = body;

    // Update employee profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        active: active !== undefined ? active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('role', 'employee')
      .select()
      .single();

    if (error) {
      console.error("[Employees] Error updating employee:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren des Mitarbeiters." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden." },
        { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session } = await requireRole('admin');
    const supabase = createClient();

    // Deactivate employee (soft delete)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('role', 'employee')
      .select()
      .single();

    if (error) {
      console.error("[Employees] Error deactivating employee:", error.message);
      return NextResponse.json(
        { error: "Fehler beim Deaktivieren des Mitarbeiters." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden." },
        { status: 404 }
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
