/**
 * Monthly Summary Computation Logic
 * Pure functions for calculating monthly summaries from timesheet entries
 */

export type SummaryInput = {
  year: number;
  month: number; // 1-12 (1-indexed)
  entries: Array<{
    id: string;
    date: string; // ISO yyyy-mm-dd
    status: 'work' | 'vacation' | 'sick';
    hours_decimal: number; // original stored value
  }>;
  corrections: Array<{
    entry_id: string;
    corrected_hours_decimal?: number | null;
    created_at: string;
  }>;
  holidays: Set<string>; // ISO dates (yyyy-mm-dd)
};

export type SummaryOutput = {
  totalMinutes: number;
  workMinutes: number;
  sickMinutes: number;
  vacationMinutes: number;
  holidayMinutes: number;
  dayOffMinutes: number;
};

/**
 * Compute monthly summary from entries, corrections, and holidays
 */
export function computeMonthlySummary(input: SummaryInput): SummaryOutput {
  const { entries, corrections, holidays } = input;

  // Build map of latest correction by entry_id (by created_at)
  const latestCorrectionByEntryId = new Map<
    string,
    { corrected_hours_decimal: number | null }
  >();

  // Build map of latest correction by entry_id (by created_at)
  const correctionsByEntryId = new Map<string, typeof corrections>();
  corrections.forEach((correction) => {
    const existing = correctionsByEntryId.get(correction.entry_id) || [];
    correctionsByEntryId.set(correction.entry_id, [...existing, correction]);
  });

  correctionsByEntryId.forEach((entryCorrections, entryId) => {
    // Find latest correction by created_at
    const latest = entryCorrections.reduce((latest, curr) =>
      new Date(curr.created_at) > new Date(latest.created_at) ? curr : latest
    );
    latestCorrectionByEntryId.set(entryId, {
      corrected_hours_decimal: latest.corrected_hours_decimal ?? null,
    });
  });

  // Initialize counters
  let workMinutes = 0;
  let sickMinutes = 0;
  let vacationMinutes = 0;
  let holidayMinutes = 0;
  let dayOffMinutes = 0;

  // Debug: Count entries by status
  const sickEntries = entries.filter((e) => e.status === 'sick');
  const vacationEntries = entries.filter((e) => e.status === 'vacation');
  const workEntries = entries.filter((e) => e.status === 'work');

  console.log('[computeMonthlySummary] Input:', {
    totalEntries: entries.length,
    sick: sickEntries.length,
    vacation: vacationEntries.length,
    work: workEntries.length,
    holidaysCount: holidays.size,
    holidays: Array.from(holidays),
    workEntryDates: workEntries.map((e) => e.date),
  });

  // Process each entry
  entries.forEach((entry) => {
    const correction = latestCorrectionByEntryId.get(entry.id);
    const effectiveHours =
      correction?.corrected_hours_decimal ?? entry.hours_decimal;
    const effectiveMinutes = Math.floor(effectiveHours * 60);

    const isHoliday = holidays.has(entry.date);
    
    // Debug log for work entries on holidays
    if (entry.status === 'work' && isHoliday) {
      console.log(`[computeMonthlySummary] Work entry on holiday: ${entry.date}, hours: ${effectiveHours}, minutes: ${effectiveMinutes}`);
    }

    if (entry.status === 'work') {
      if (isHoliday) {
        // Work on a holiday → counts as holiday only
        holidayMinutes += effectiveMinutes;
        console.log(`[computeMonthlySummary] Added ${effectiveMinutes} minutes to holiday (work on ${entry.date})`);
      } else {
        // Work on a regular day → counts as work
        workMinutes += effectiveMinutes;
      }
    } else if (entry.status === 'sick') {
      // Sick days: always 8h = 480 minutes per entry
      // Each entry represents one sick day
      sickMinutes += 480;
    } else if (entry.status === 'vacation') {
      // Vacation days: always 8h = 480 minutes per entry
      // Each entry represents one vacation day
      vacationMinutes += 480;
    } else if (entry.status === 'day_off') {
      // Tagesbefreiung (day_off): respect the stored hours (can be full-day or partial)
      dayOffMinutes += effectiveMinutes;
    }
  });

  console.log('[computeMonthlySummary] Result:', {
    workMinutes,
    sickMinutes,
    vacationMinutes,
    holidayMinutes,
    dayOffMinutes,
    totalMinutes:
      workMinutes +
      sickMinutes +
      vacationMinutes +
      holidayMinutes +
      dayOffMinutes,
  });

  const totalMinutes =
    workMinutes + sickMinutes + vacationMinutes + holidayMinutes + dayOffMinutes;

  return {
    totalMinutes,
    workMinutes,
    sickMinutes,
    vacationMinutes,
    holidayMinutes,
    dayOffMinutes,
  };
}

/**
 * Format minutes as German hour+minute string: "X h Y min"
 */
export function formatMinutesDe(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins} min`;
}

