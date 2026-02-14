/**
 * Server-side data loader for monthly summary
 * Fetches entries, corrections, and holidays for a specific month
 */

import { createClient } from '@/lib/supabase/server';
import { getHolidaysForMonth } from '@/lib/data/holidays';

export interface MonthlyData {
  entries: Array<{
    id: string;
    date: string;
    // Include day_off so Tagesbefreiungen are part of the monthly summary
    status: 'work' | 'vacation' | 'sick' | 'day_off';
    hours_decimal: number;
  }>;
  corrections: Array<{
    entry_id: string;
    corrected_hours_decimal?: number | null;
    created_at: string;
  }>;
  holidays: Set<string>;
}

/**
 * Load monthly data for an employee
 * @param employeeId - Employee profile ID
 * @param year - Year (e.g., 2026)
 * @param month - Month (0-indexed, e.g., 0 = January, 11 = December)
 * @returns Monthly data including entries, corrections, and holidays
 */
export async function loadMonthlyData(
  employeeId: string,
  year: number,
  month: number
): Promise<MonthlyData> {
  const supabase = createClient();

  // Calculate first and last day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayISO = firstDay.toISOString().split('T')[0];
  const lastDayISO = lastDay.toISOString().split('T')[0];

  // Fetch entries for the month
  const { data: entriesData, error: entriesError } = await supabase
    .from('timesheet_entries')
    .select('id, date, status, hours_decimal')
    .eq('employee_id', employeeId)
    .gte('date', firstDayISO)
    .lte('date', lastDayISO)
    .order('date', { ascending: true });

  if (entriesError) {
    console.error('[loadMonthlyData] Error fetching entries:', entriesError);
    throw new Error('Failed to load entries');
  }

  const entries =
    entriesData?.map((e) => ({
      id: e.id,
      date: e.date,
      status: e.status as 'work' | 'vacation' | 'sick' | 'day_off',
      hours_decimal: e.hours_decimal || 0,
    })) || [];

  // Fetch corrections for these entries
  const entryIds = entries.map((e) => e.id);
  let corrections: MonthlyData['corrections'] = [];

  if (entryIds.length > 0) {
    const { data: correctionsData, error: correctionsError } = await supabase
      .from('timesheet_corrections')
      .select('entry_id, corrected_hours_decimal, created_at')
      .in('entry_id', entryIds)
      .order('created_at', { ascending: false });

    if (correctionsError) {
      console.error(
        '[loadMonthlyData] Error fetching corrections:',
        correctionsError
      );
      // Don't throw - corrections are optional
    } else {
      corrections =
        correctionsData?.map((c) => ({
          entry_id: c.entry_id,
          corrected_hours_decimal: c.corrected_hours_decimal,
          created_at: c.created_at,
        })) || [];
    }
  }

  // Fetch holidays for the month
  const holidaysArray = await getHolidaysForMonth(year, month);
  const holidays = new Set(holidaysArray.map((h) => h.dateISO));

  console.log('[loadMonthlyData] Holidays loaded:', {
    year,
    month,
    holidaysCount: holidays.size,
    holidays: Array.from(holidays),
    holidayDates: holidaysArray.map((h) => h.dateISO),
  });
  
  console.log('[loadMonthlyData] Entry dates for comparison:', {
    entryDates: entries.map((e) => ({ date: e.date, status: e.status })),
  });

  return {
    entries,
    corrections,
    holidays,
  };
}

/**
 * Mock data for testing (if USE_MOCKS env var is set)
 */
export function getMockMonthlyData(
  year: number,
  month: number
): MonthlyData {
  // Return empty mock data
  return {
    entries: [],
    corrections: [],
    holidays: new Set(),
  };
}

