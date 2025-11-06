/**
 * API Route: GET /api/holidays
 * Returns holidays for a specific month
 * Query params: year, month, state (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHolidaysForMonth, FALLBACK_HOLIDAYS_2026, FALLBACK_HOLIDAYS_2025 } from '@/lib/data/holidays';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const stateParam = searchParams.get('state') || undefined;

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

    try {
      const holidays = await getHolidaysForMonth(year, month, stateParam);
      
      // If no holidays found and it's 2025 or 2026, use fallback
      if (holidays.length === 0 && (year === 2025 || year === 2026)) {
        const fallbackHolidays = year === 2025 ? FALLBACK_HOLIDAYS_2025 : FALLBACK_HOLIDAYS_2026;
        const monthHolidays = fallbackHolidays.filter((h) => {
          const date = new Date(h.dateISO);
          return date.getFullYear() === year && date.getMonth() === month;
        });
        console.log(`[API /holidays] Using fallback for ${year}-${month}: ${monthHolidays.length} holidays`);
        return NextResponse.json({ data: monthHolidays });
      }
      
      return NextResponse.json({ data: holidays });
    } catch (error) {
      console.error('[API /holidays] Error fetching holidays:', error);
      
      // Fallback: use 2025/2026 holidays if available and year matches
      if (year === 2025 || year === 2026) {
        const fallbackHolidays = year === 2025 ? FALLBACK_HOLIDAYS_2025 : FALLBACK_HOLIDAYS_2026;
        const monthHolidays = fallbackHolidays.filter((h) => {
          const date = new Date(h.dateISO);
          return date.getFullYear() === year && date.getMonth() === month;
        });
        console.log(`[API /holidays] Fallback after error: ${monthHolidays.length} holidays`);
        return NextResponse.json({ data: monthHolidays });
      }

      // Return empty array if fallback not available
      return NextResponse.json({ data: [] });
    }
  } catch (error) {
    console.error('[API /holidays] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

