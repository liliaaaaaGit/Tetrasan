import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * API Routes for Employee Holiday Exclusions (Admin only)
 * POST: Delete a holiday for an employee
 * DELETE: Restore a holiday for an employee (remove exclusion)
 */

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const userClient = createClient();
    const admin = getAdminClient();
    const { data: { session } } = await userClient.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    const { data: me } = await admin
      .from('profiles')
      .select('id, role, active')
      .eq('id', session.user.id)
      .single();

    if (!me || me.role !== 'admin' || me.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const body = await request.json();
    const { employeeId, holidayDate } = body;

    if (!employeeId || !holidayDate) {
      return NextResponse.json(
        { error: "employeeId und holidayDate sind erforderlich." },
        { status: 400 }
      );
    }

    // Verify employee exists
    const { data: employee, error: empError } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', employeeId)
      .eq('role', 'employee')
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden." },
        { status: 404 }
      );
    }

    // Verify holiday exists
    const { data: holiday, error: holidayError } = await admin
      .from('holidays')
      .select('holiday_date, name')
      .eq('holiday_date', holidayDate)
      .single();

    if (holidayError || !holiday) {
      return NextResponse.json(
        { error: "Feiertag nicht gefunden." },
        { status: 404 }
      );
    }

    // Create exclusion (or update if exists)
    const { data: exclusion, error: insertError } = await admin
      .from('employee_holiday_exclusions')
      .upsert({
        employee_id: employeeId,
        holiday_date: holidayDate,
        created_by: session.user.id,
      }, {
        onConflict: 'employee_id,holiday_date'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[EmployeeHolidayExclusions] Error creating exclusion:', insertError.message);
      return NextResponse.json(
        { error: "Fehler beim Löschen des Feiertags." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      exclusion: {
        id: exclusion.id,
        employeeId: exclusion.employee_id,
        holidayDate: exclusion.holiday_date,
      }
    });
  } catch (error) {
    console.error('[EmployeeHolidayExclusions] Unexpected error:', error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const userClient = createClient();
    const admin = getAdminClient();
    const { data: { session } } = await userClient.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    const { data: me } = await admin
      .from('profiles')
      .select('id, role, active')
      .eq('id', session.user.id)
      .single();

    if (!me || me.role !== 'admin' || me.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const holidayDate = searchParams.get('holidayDate');

    if (!employeeId || !holidayDate) {
      return NextResponse.json(
        { error: "employeeId und holidayDate sind erforderlich." },
        { status: 400 }
      );
    }

    // Delete exclusion (restore holiday)
    const { error: deleteError } = await admin
      .from('employee_holiday_exclusions')
      .delete()
      .eq('employee_id', employeeId)
      .eq('holiday_date', holidayDate);

    if (deleteError) {
      console.error('[EmployeeHolidayExclusions] Error deleting exclusion:', deleteError.message);
      return NextResponse.json(
        { error: "Fehler beim Wiederherstellen des Feiertags." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EmployeeHolidayExclusions] Unexpected error:', error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
