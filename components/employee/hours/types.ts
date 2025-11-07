/**
 * Types for employee hours tracking
 */

export type DayStatus = "arbeit" | "urlaub" | "krank";

export interface DayEntry {
  id?: string; // Database ID
  date: string; // YYYY-MM-DD
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
}

export interface MonthSummary {
  totalHours: number;
  vacationDays: number;
  sickDays: number;
}

