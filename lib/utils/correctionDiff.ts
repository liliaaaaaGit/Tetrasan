import { DayEntry } from "@/components/employee/hours/types";

interface Correction {
  id?: string;
  entry_id: string;
  corrected_time_from?: string;
  corrected_time_to?: string;
  corrected_break_minutes?: number;
  corrected_hours_decimal?: number;
  note?: string;
  created_at?: string;
  admin?: {
    full_name?: string;
    email?: string;
  };
}

interface FieldDiff {
  original: string | number | undefined;
  corrected: string | number | undefined;
  changed: boolean;
}

interface CorrectionDiff {
  timeRange: FieldDiff;
  breakMinutes: FieldDiff;
  hours: FieldDiff;
  note: FieldDiff;
  hasChanges: boolean;
}

/**
 * Compare original entry with correction and return per-field diffs
 */
export function diffCorrections(
  original: DayEntry,
  correction: Correction
): CorrectionDiff {
  // Normalize time strings (remove seconds if present)
  const normalizeTime = (time: string | undefined): string => {
    if (!time) return "";
    return time.length === 8 ? time.substring(0, 5) : time;
  };

  // Format time range (with seconds for display)
  const formatTimeRange = (from?: string, to?: string): string => {
    if (!from || !to) return "";
    // Ensure seconds are included
    let normFrom = from;
    let normTo = to;
    if (normFrom.length === 5) normFrom = `${normFrom}:00`;
    if (normTo.length === 5) normTo = `${normTo}:00`;
    return `${normFrom} - ${normTo}`;
  };

  // Compare time range
  const originalTimeRange = formatTimeRange(original.from, original.to);
  const correctedTimeRange = formatTimeRange(
    correction.corrected_time_from,
    correction.corrected_time_to
  );
  
  // For comparison, normalize both to remove seconds
  const normalizeForComparison = (timeRange: string): string => {
    return timeRange.replace(/:\d{2}$/g, ""); // Remove :SS at the end
  };
  
  // Time range changed if both times are provided and they differ
  const timeRangeChanged =
    correction.corrected_time_from !== undefined &&
    correction.corrected_time_to !== undefined &&
    normalizeForComparison(originalTimeRange) !== normalizeForComparison(correctedTimeRange);

  // Compare break minutes
  const originalBreak = original.pause || 0;
  const correctedBreak =
    correction.corrected_break_minutes !== undefined
      ? correction.corrected_break_minutes
      : originalBreak;
  const breakChanged = originalBreak !== correctedBreak;

  // Compare hours
  const originalHours = original.hours || 0;
  const correctedHours =
    correction.corrected_hours_decimal !== undefined
      ? correction.corrected_hours_decimal
      : originalHours;
  const hoursChanged = originalHours !== correctedHours;

  // Compare note
  const originalNote = original.note || original.taetigkeit || original.comment || original.kommentar || "";
  const correctedNote = correction.note || "";
  const noteChanged = correctedNote !== "" && originalNote !== correctedNote;

  const hasChanges = timeRangeChanged || breakChanged || hoursChanged || noteChanged;

  return {
    timeRange: {
      original: originalTimeRange,
      corrected: correctedTimeRange,
      changed: timeRangeChanged,
    },
    breakMinutes: {
      original: originalBreak,
      corrected: correctedBreak,
      changed: breakChanged,
    },
    hours: {
      original: originalHours,
      corrected: correctedHours,
      changed: hoursChanged,
    },
    note: {
      original: originalNote,
      corrected: correctedNote,
      changed: noteChanged,
    },
    hasChanges,
  };
}

