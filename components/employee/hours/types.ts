/**
 * Types for employee hours tracking
 */

export type DayStatus = "arbeit" | "urlaub" | "krank" | "tagesbefreiung";

export interface DayEntry {
  id?: string; // Database ID
  date: string; // YYYY-MM-DD (for Urlaub this is typically the clicked day or range start)
  status: DayStatus;
  from?: string; // HH:MM
  to?: string; // HH:MM
  pause?: number; // minutes
  taetigkeit?: string; // Activity report
  bauvorhaben?: string; // Project name / site
  kommentar?: string; // Comment
  note?: string; // Activity note (alias for taetigkeit)
  comment?: string; // Comment (alias for kommentar)
  hours?: number; // Calculated hours (decimal)
  /**
   * Optional date range for vacation (Urlaub) entries created from the Stunden modal.
   * When present, the save handler will create one vacation entry per day in the range.
   */
  rangeStart?: string; // YYYY-MM-DD
  rangeEnd?: string; // YYYY-MM-DD
}

export interface MonthSummary {
  totalHours: number;
  vacationDays: number;
  sickDays: number;
}

