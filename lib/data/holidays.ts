/**
 * Server-side helper functions for fetching holidays from Supabase
 */

import { createClient } from '@/lib/supabase/server';

export interface Holiday {
  dateISO: string;
  name: string;
}

/**
 * Get holidays for a specific month
 * @param year - Year (e.g., 2026)
 * @param month - Month (0-indexed, e.g., 0 = January, 11 = December)
 * @param state - Optional state code (e.g., 'BY' for Bavaria)
 * @param employeeId - Optional employee ID to exclude deleted holidays for that employee
 * @returns Array of holidays with dateISO and name
 */
export async function getHolidaysForMonth(
  year: number,
  month: number,
  state?: string,
  employeeId?: string
): Promise<Holiday[]> {
  const supabase = createClient();

  // Calculate first and last day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0); // Last day of month
  
  const firstDayISO = firstDay.toISOString().split('T')[0];
  const lastDayISO = lastDay.toISOString().split('T')[0];

  // Build query: get holidays for country='DE' in date range
  // If state is provided, show national holidays OR state-specific holidays for that state
  // If state is not provided, show ALL holidays (national + all states) for summary purposes
  let query = supabase
    .from('holidays')
    .select('holiday_date, name')
    .eq('country', 'DE')
    .gte('holiday_date', firstDayISO)
    .lte('holiday_date', lastDayISO)
    .order('holiday_date', { ascending: true });

  // If state is provided, filter for national holidays OR state-specific for that state
  // Otherwise, get ALL holidays (no state filter) - this ensures all holidays are counted in summary
  if (state) {
    query = query.or(`state.is.null,state.eq.${state}`);
  }
  // No else clause - when no state provided, get all holidays (national + all states)

  let data, error;
  try {
    const result = await query;
    data = result.data;
    error = result.error;
    
    // If error exists, treat it as a failure
    if (error) {
      console.error('[getHolidaysForMonth] Supabase error:', error);
    }
  } catch (e) {
    // Query failed (table doesn't exist, etc.)
    console.error('[getHolidaysForMonth] Query exception:', e);
    error = e as any;
    data = null;
  }

  // Always use fallback for 2025/2026 if there's an error OR no data
  if (error || !data || data.length === 0) {
    if (year === 2025) {
      console.log(`[getHolidaysForMonth] Using fallback for 2025 (month ${month}) - error: ${!!error}, data: ${data?.length || 0}`);
      const monthHolidays = FALLBACK_HOLIDAYS_2025.filter((h) => {
        const date = new Date(h.dateISO);
        return date.getFullYear() === year && date.getMonth() === month;
      });
      console.log(`[getHolidaysForMonth] Fallback returned ${monthHolidays.length} holidays for month ${month}:`, monthHolidays.map(h => h.dateISO));
      return monthHolidays;
    } else if (year === 2026) {
      console.log(`[getHolidaysForMonth] Using fallback for 2026 (month ${month}) - error: ${!!error}, data: ${data?.length || 0}`);
      const monthHolidays = FALLBACK_HOLIDAYS_2026.filter((h) => {
        const date = new Date(h.dateISO);
        return date.getFullYear() === year && date.getMonth() === month;
      });
      console.log(`[getHolidaysForMonth] Fallback returned ${monthHolidays.length} holidays for month ${month}:`, monthHolidays.map(h => h.dateISO));
      return monthHolidays;
    }
    // Return empty array if not 2025 or 2026
    return [];
  }

  console.log('[getHolidaysForMonth] Successfully loaded holidays:', {
    count: data.length,
    dates: data.map((h) => h.holiday_date),
  });

  // If employeeId is provided, exclude holidays that have been deleted for this employee
  let excludedDates: Set<string> = new Set();
  if (employeeId) {
    try {
      const { data: exclusions, error: exclusionsError } = await supabase
        .from('employee_holiday_exclusions')
        .select('holiday_date')
        .eq('employee_id', employeeId)
        .gte('holiday_date', firstDayISO)
        .lte('holiday_date', lastDayISO);
      
      if (!exclusionsError && exclusions) {
        excludedDates = new Set(exclusions.map((e: any) => e.holiday_date));
        console.log('[getHolidaysForMonth] Excluded holidays for employee:', {
          employeeId,
          excludedDates: Array.from(excludedDates),
        });
      }
    } catch (e) {
      console.error('[getHolidaysForMonth] Error fetching exclusions:', e);
      // Continue without exclusions if there's an error
    }
  }

  // Transform to Holiday format and filter out excluded holidays
  return data
    .filter((h) => !excludedDates.has(h.holiday_date))
    .map((h) => ({
      dateISO: h.holiday_date,
      name: h.name,
    }));
}

/**
 * Fallback client-side holidays array (2026 Germany)
 * Use this if Supabase is temporarily unavailable
 */
export const FALLBACK_HOLIDAYS_2026: Holiday[] = [
  { dateISO: '2026-01-01', name: 'Neujahr' },
  { dateISO: '2026-01-06', name: 'Heilige Drei Könige' },
  { dateISO: '2026-04-03', name: 'Karfreitag' },
  { dateISO: '2026-04-06', name: 'Ostermontag' },
  { dateISO: '2026-05-01', name: 'Tag der Arbeit' },
  { dateISO: '2026-05-14', name: 'Christi Himmelfahrt' },
  { dateISO: '2026-05-25', name: 'Pfingstmontag' },
  { dateISO: '2026-06-04', name: 'Fronleichnam' },
  { dateISO: '2026-08-15', name: 'Mariä Himmelfahrt' },
  { dateISO: '2026-10-03', name: 'Tag der Deutschen Einheit' },
  { dateISO: '2026-12-25', name: '1. Weihnachtstag' },
  { dateISO: '2026-12-26', name: '2. Weihnachtstag' },
];

/**
 * Fallback holidays for 2025
 */
export const FALLBACK_HOLIDAYS_2025: Holiday[] = [
  { dateISO: '2025-11-01', name: 'Allerheiligen' },
  { dateISO: '2025-12-25', name: '1. Weihnachtstag' },
  { dateISO: '2025-12-26', name: '2. Weihnachtstag' },
];

