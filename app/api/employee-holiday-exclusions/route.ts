import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST: Add an employee holiday exclusion (admin only)
export async function POST(request: NextRequest) {
  try {
    const userClient = createClient();
    const { data: { session } } = await userClient.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const admin = getAdminClient();
    const { data: me } = await admin
      .from('profiles')
      .select('role, active')
      .eq('id', session.user.id)
      .single();

    if (!me || me.role !== 'admin' || me.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const { employeeId, holidayDate } = await request.json();

    if (!employeeId || !holidayDate) {
      return NextResponse.json({ error: "employeeId und holidayDate sind erforderlich." }, { status: 400 });
    }

    const { data, error } = await admin
      .from('employee_holiday_exclusions')
      .insert({
        employee_id: employeeId,
        holiday_date: holidayDate,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[EmployeeHolidayExclusions] Error creating exclusion:", error.message);
      return NextResponse.json({ error: "Fehler beim Hinzufügen der Feiertagsausnahme." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[EmployeeHolidayExclusions] Unexpected error in POST:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}

// DELETE: Remove an employee holiday exclusion (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const userClient = createClient();
    const { data: { session } } = await userClient.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const admin = getAdminClient();
    const { data: me } = await admin
      .from('profiles')
      .select('role, active')
      .eq('id', session.user.id)
      .single();

    if (!me || me.role !== 'admin' || me.active === false) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
    }

    const { employeeId, holidayDate } = await request.json();

    if (!employeeId || !holidayDate) {
      return NextResponse.json({ error: "employeeId und holidayDate sind erforderlich." }, { status: 400 });
    }

    const { error } = await admin
      .from('employee_holiday_exclusions')
      .delete()
      .eq('employee_id', employeeId)
      .eq('holiday_date', holidayDate);

    if (error) {
      console.error("[EmployeeHolidayExclusions] Error deleting exclusion:", error.message);
      return NextResponse.json({ error: "Fehler beim Entfernen der Feiertagsausnahme." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EmployeeHolidayExclusions] Unexpected error in DELETE:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten." }, { status: 500 });
  }
}
