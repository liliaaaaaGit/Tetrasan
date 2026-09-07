import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { restoreArchivedEmployeeAccess, revokeArchivedEmployeeAccess } from "@/lib/auth/employee-access";

/**
 * API Routes for Individual Employee Management (Admin only)
 * GET: Fetch employee details with timesheet entries and leave requests
 * PUT: Update employee profile
 * DELETE: Deactivate employee, or permanently delete with ?permanent=true
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

    if (data.active === false) {
      await revokeArchivedEmployeeAccess(params.id);
    } else {
      await restoreArchivedEmployeeAccess(params.id);
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
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    if (!permanent) {
      // Deactivate employee (soft delete / move to archive)
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

      await revokeArchivedEmployeeAccess(params.id);
      return NextResponse.json({ data });
    }

    // Permanent delete from archive: profile row + related data + login account
    const admin = getAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", params.id)
      .eq("role", "employee")
      .maybeSingle();

    if (profileError) {
      console.error("[Employees] Error loading employee for delete:", profileError.message);
      return NextResponse.json(
        { error: "Fehler beim Löschen des Mitarbeiters." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden." },
        { status: 404 }
      );
    }

    // Clear optional FKs that would otherwise block the profile delete
    await admin.from("timesheet_months").update({ approved_by: null }).eq("approved_by", params.id);
    await admin.from("leave_requests").update({ approved_by: null }).eq("approved_by", params.id);

    const { error: deleteError } = await admin
      .from("profiles")
      .delete()
      .eq("id", params.id)
      .eq("role", "employee");

    if (deleteError) {
      console.error("[Employees] Error deleting employee:", deleteError.message);
      return NextResponse.json(
        { error: "Fehler beim Löschen des Mitarbeiters." },
        { status: 500 }
      );
    }

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(params.id);
    if (authDeleteError && authDeleteError.message && !/user not found/i.test(authDeleteError.message)) {
      console.error("[Employees] Error deleting auth user:", authDeleteError.message);
    }

    return NextResponse.json({ data: { id: params.id, deleted: true } });
  } catch (error) {
    console.error("[Employees] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
