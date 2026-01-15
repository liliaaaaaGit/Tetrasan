"use client";

import React, { useState } from "react";
import { DayEntry } from "@/components/employee/hours/types";
import { Edit } from "lucide-react";
import { AdminCorrectionDialog } from "@/components/admin/hours/AdminCorrectionDialog";
import { cn } from "@/lib/utils";
import { diffCorrections } from "@/lib/utils/correctionDiff";

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

interface Holiday {
  dateISO: string;
  name: string;
}

interface MonthlyOverviewListProps {
  year: number;
  month: number;
  employeeId?: string;
  isAdmin?: boolean;
  // Multiple entries (work, vacation, sick, day-off) per day
  entries: Record<string, DayEntry[]>;
  corrections: Record<string, Correction>;
  holidays: Record<string, Holiday>;
  onCorrectionSave?: (correction: any) => Promise<void>;
  onRefresh?: () => void;
}

/**
 * MonthlyOverviewList Component
 * Displays a list of all days with recorded activity for the selected month
 * Shows corrections in red below original entries
 * Allows admins to add corrections
 */
export function MonthlyOverviewList({
  year,
  month,
  employeeId,
  isAdmin = false,
  entries,
  corrections,
  holidays,
  onCorrectionSave,
  onRefresh,
}: MonthlyOverviewListProps) {
  const [selectedCorrectionEntryId, setSelectedCorrectionEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get all entries for the current month, sorted by date
  const monthEntries = Object.values(entries)
    .flat()
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === year &&
        entryDate.getMonth() === month
      );
    })
    .sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  // Check if entry is on a holiday
  const isHoliday = (date: string): boolean => {
    return !!holidays[date];
  };

  // Get status label and color
  const getStatusInfo = (entry: DayEntry, isHolidayDate: boolean) => {
    if (isHolidayDate && entry.status === "arbeit") {
      return { label: "Feiertag", color: "text-brand" };
    }
    switch (entry.status) {
      case "arbeit":
        return { label: "Arbeit", color: "text-gray-700" };
      case "urlaub":
        return { label: "Urlaub", color: "text-yellow-600" };
      case "krank":
        return { label: "Krank", color: "text-red-600" };
      case "tagesbefreiung":
        return { label: "Tagesbefreiung", color: "text-blue-600" };
      default:
        return { label: "Arbeit", color: "text-gray-700" };
    }
  };

  // Format date as DD.M.YYYY
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Format hours with break
  const formatHoursBreak = (hours: number, breakMinutes: number): string => {
    const hoursStr = hours.toFixed(1).replace(",", ".");
    return `${hoursStr}h (${breakMinutes}min Pause)`;
  };

  // Format hours for day-off (no break)
  const formatDayOffHours = (hours?: number): string => {
    if (typeof hours !== "number") return "0,0h";
    // Show with one decimal place, using comma as decimal separator for consistency
    const hoursStr = hours.toFixed(1).replace(".", ",");
    return `${hoursStr}h`;
  };

  // Format time range with seconds
  const formatTimeRangeWithSeconds = (from?: string, to?: string): string => {
    if (!from || !to) return "00:00:00 - 00:01:00";
    let normFrom = from;
    let normTo = to;
    // If format is HH:MM, add :00 for seconds
    if (normFrom.length === 5) normFrom = `${normFrom}:00`;
    if (normTo.length === 5) normTo = `${normTo}:00`;
    return `${normFrom} - ${normTo}`;
  };

  // Format time range for display
  const formatTimeRange = (entry: DayEntry): string => {
    if (entry.status === "arbeit" && entry.from && entry.to) {
      return formatTimeRangeWithSeconds(entry.from, entry.to);
    }
    if (entry.status === "tagesbefreiung") {
      // For day-off: only show time range if it's a partial day (not full-day with 00:00-00:01)
      // Normalize time strings (remove seconds if present) for comparison
      const normalizedFrom = entry.from?.substring(0, 5) || "";
      const normalizedTo = entry.to?.substring(0, 5) || "";
      // Check if it's a full-day entry (8 hours with default placeholder times)
      const isFullDay = normalizedFrom === "00:00" && normalizedTo === "00:01" && 
                        typeof entry.hours === "number" && Math.abs(entry.hours - 8) < 0.01;
      
      if (!isFullDay && entry.from && entry.to) {
        // Partial day-off: show actual time range
        return formatTimeRangeWithSeconds(entry.from, entry.to);
      }
      // Full day-off: return empty string (will be hidden in display)
      return "";
    }
    return "00:00:00 - 00:01:00";
  };

  // Handle save correction
  const handleSaveCorrection = async (correctionData: any) => {
    setIsSaving(true);
    try {
      if (onCorrectionSave) {
        await onCorrectionSave(correctionData);
      }
      setSelectedCorrectionEntryId(null);
      // Refresh data after saving
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving correction:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (monthEntries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-6 space-y-2">
        {monthEntries.map((entry) => {
          const holidayDate = isHoliday(entry.date);
          const statusInfo = getStatusInfo(entry, holidayDate);
          const correction = entry.id ? corrections[entry.id] : undefined;
          const projectName = entry.bauvorhaben || "";
          const entryNote = entry.note || entry.taetigkeit || entry.comment || entry.kommentar || "";
          
          // Compute diffs if correction exists
          const diffs = correction ? diffCorrections(entry, correction) : null;
          const hasCorrection = diffs?.hasChanges || false;

          return (
            <div
              key={entry.id || entry.date}
              className="bg-white border border-border rounded-lg p-4"
            >
              {/* Top row: Date | Type | Korrektur badge | [spacer] | Correction button */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                {/* Left side: Date, Type, Korrektur badge */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatDate(entry.date)}
                  </span>
                  <span className={cn("text-sm font-medium", statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                  {hasCorrection && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                      Korrektur aktiv
                    </span>
                  )}
                </div>

                {/* Top right: Correction button (Admin only, for work entries) */}
                {isAdmin && entry.status === "arbeit" && entry.id && (
                  <button
                    onClick={() => {
                      if (entry.id) {
                        setSelectedCorrectionEntryId(entry.id);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
                  >
                    <Edit className="h-3 w-3" />
                    <span>{correction ? "Korrektur bearbeiten" : "Korrektur hinzufügen"}</span>
                  </button>
                )}
              </div>

              {/* Second row: Time & Break (left) | Tätigkeitsbericht (middle-right) */}
              <div className="flex items-start justify-between gap-4">
                {/* Left side: Time & Break (for Arbeit) or Comment (for Urlaub/Krank) */}
                <div className="flex-1">
                  {entry.status === "arbeit" && (
                    <>
                      {/* Time Range */}
                      <div className="text-sm text-gray-600 mb-1" id={`timerange-${entry.id}`}>
                        {formatTimeRange(entry)}
                        {diffs?.timeRange.changed && diffs.timeRange.corrected && (
                          <div className="text-xs text-red-600 mt-0.5" aria-describedby={`timerange-${entry.id}`}>
                            <span className="sr-only">Korrektur: </span>
                            {diffs.timeRange.corrected as string}
                          </div>
                        )}
                      </div>

                      {/* Hours and Break */}
                      <div className="text-sm text-gray-600" id={`hours-${entry.id}`}>
                        {formatHoursBreak(entry.hours || 0, entry.pause || 0)}
                        {(diffs?.hours.changed || diffs?.breakMinutes.changed) && diffs && (
                          <div className="text-xs text-red-600 mt-0.5" aria-describedby={`hours-${entry.id}`}>
                            <span className="sr-only">Korrektur: </span>
                            {formatHoursBreak(
                              diffs.hours.corrected !== undefined ? (diffs.hours.corrected as number) : (entry.hours || 0),
                              diffs.breakMinutes.corrected !== undefined ? (diffs.breakMinutes.corrected as number) : (entry.pause || 0)
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {entry.status === "tagesbefreiung" && (
                    <>
                      {/* Time Range (only for partial day-off) */}
                      {formatTimeRange(entry) && (
                        <div className="text-sm text-gray-600 mb-1">
                          {formatTimeRange(entry)}
                        </div>
                      )}
                      {/* Duration for day-off (partial or full day) */}
                      <div className="text-sm text-gray-600">
                        Dauer (Tagesbefreiung): {formatDayOffHours(entry.hours)}
                      </div>
                    </>
                  )}
                  {(entry.status === "urlaub" || entry.status === "krank") && entryNote && (
                    <div className="text-sm text-gray-600">
                      {entryNote}
                    </div>
                  )}
                </div>

                {/* Middle-right side: Bauvorhaben & Tätigkeitsbericht (only for Arbeit) */}
                {entry.status === "arbeit" && (
                  <div className="flex-1 text-right space-y-2">
                    {projectName && (
                      <div className="text-sm text-gray-600" id={`project-${entry.id}`}>
                        <div className="text-xs text-gray-500 mb-0.5">Bauvorhaben</div>
                        {projectName}
                      </div>
                    )}
                    {entryNote ? (
                      <div className="text-sm text-gray-600" id={`note-${entry.id}`}>
                        <div className="text-xs text-gray-500 mb-0.5">Tätigkeitsbericht (Mitarbeiter)</div>
                        {entryNote}
                        {diffs?.note.changed && diffs.note.corrected && (
                          <div className="text-xs text-red-600 mt-0.5" aria-describedby={`note-${entry.id}`}>
                            <span className="sr-only">Korrektur: </span>
                            {diffs.note.corrected as string}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        Kein Tätigkeitsbericht
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Correction Dialog */}
      {isAdmin && selectedCorrectionEntryId && (() => {
        const entryForCorrection = monthEntries.find(e => e.id === selectedCorrectionEntryId);
        return entryForCorrection ? (
          <AdminCorrectionDialog
            open={!!selectedCorrectionEntryId}
            onOpenChange={(open: boolean) => !open && setSelectedCorrectionEntryId(null)}
            entryId={selectedCorrectionEntryId}
            originalEntry={entryForCorrection}
            existingCorrection={corrections[selectedCorrectionEntryId]}
            onSave={handleSaveCorrection}
            isLoading={isSaving}
          />
        ) : null;
      })()}
    </>
  );
}

