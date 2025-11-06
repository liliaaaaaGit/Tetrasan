/**
 * API Route: GET /api/monthly-summary
 * Returns monthly summary for the authenticated employee (or specific employee if admin)
 * Query params: year, month (0-indexed), employeeId (optional, admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/session';
import { loadMonthlyData } from '@/lib/data/monthlyData';
import { computeMonthlySummary } from '@/lib/logic/monthlySummary';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const employeeIdParam = searchParams.get('employeeId');

    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { error: 'Year and month parameters are required' },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json(
        { error: 'Invalid year or month' },
        { status: 400 }
      );
    }

    // Determine target employee ID
    let targetEmployeeId = session.user.id;
    if (employeeIdParam) {
      // Admin access - verify admin role
      const { session: adminSession } = await requireRole('admin');
      if (!adminSession) {
        return NextResponse.json(
          { error: 'Nicht autorisiert.' },
          { status: 403 }
        );
      }
      targetEmployeeId = employeeIdParam;
    }

    // Load monthly data
    const monthlyData = await loadMonthlyData(targetEmployeeId, year, month);

    console.log('[API /monthly-summary] Monthly data loaded:', {
      entriesCount: monthlyData.entries.length,
      correctionsCount: monthlyData.corrections.length,
      holidaysCount: monthlyData.holidays.size,
      holidays: Array.from(monthlyData.holidays),
      workEntries: monthlyData.entries.filter((e) => e.status === 'work').map((e) => ({
        date: e.date,
        hours: e.hours_decimal,
      })),
    });

    // Compute summary (month is 0-indexed in JS, computeMonthlySummary expects 1-indexed)
    const summary = computeMonthlySummary({
      year,
      month: month + 1, // Convert to 1-indexed
      entries: monthlyData.entries,
      corrections: monthlyData.corrections,
      holidays: monthlyData.holidays,
    });

    console.log('[API /monthly-summary] Summary computed:', summary);

    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error('[API /monthly-summary] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute monthly summary' },
      { status: 500 }
    );
  }
}

