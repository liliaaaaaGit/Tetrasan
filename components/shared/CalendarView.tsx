"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { DayEntryDialog } from "@/components/employee/hours/DayEntryDialog";
import { useMonthState } from "@/components/employee/hours/useMonthState";
import { DayEntry } from "@/components/employee/hours/types";
import { scrollToDateHash } from "@/components/employee/hours/dateAnchors";
import {
  getCalendarGrid,
  isToday,
  formatDateISO,
  formatHours,
  isSunday,
  isWeekend,
  isBlockedDay,
} from "@/lib/date-utils";
import { ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlySummaryCard } from "@/components/summary/MonthlySummaryCard";
import { SummaryOutput } from "@/lib/logic/monthlySummary";
import { AdminCorrectionDialog } from "@/components/admin/hours/AdminCorrectionDialog";
import { MonthlyOverviewList } from "@/components/shared/MonthlyOverviewList";
import { useRouter } from "next/navigation";

interface Holiday {
  dateISO: string;
  name: string;
}

interface Correction {
  id: string;
  entry_id: string;
  corrected_time_from?: string;
  corrected_time_to?: string;
  corrected_break_minutes?: number;
  corrected_hours_decimal?: number;
  note?: string;
  created_at: string;
  admin?: {
    full_name?: string;
    email?: string;
  };
}

interface CalendarViewProps {
  employeeId: string;
  employeeName?: string;
  isAdmin?: boolean;
  onEntrySave?: (entry: DayEntry) => void;
  onEntryDelete?: (entryId: string) => void;
  onCorrectionSave?: (correction: any) => void;
}

/**
 * Shared Calendar View Component
 * Works for both employee and admin views
 * Features:
 * - Monthly calendar grid
 * - Today highlighted
 * - Month navigation
 * - Click day to open entry modal
 * - Monthly summary
 * - Admin corrections (if isAdmin=true)
 * - PDF export (if isAdmin=true)
 */
export function CalendarView({
  employeeId,
  employeeName,
  isAdmin = false,
  onEntrySave,
  onEntryDelete,
  onCorrectionSave,
}: CalendarViewProps) {
  const router = useRouter();
  // For admin context, don't pass basePath so URL doesn't change
  // For employee context, use default '/employee/hours'
  const { year, month, goToPreviousMonth, goToNextMonth } = useMonthState(
    isAdmin ? '' : '/employee/hours'
  );
  // Multiple entries (work, vacation, sick, day-off) can exist on the same date.
  const [entries, setEntries] = useState<Record<string, DayEntry[]>>({});
  const [corrections, setCorrections] = useState<Record<string, Correction>>({});
  const [holidays, setHolidays] = useState<Record<string, Holiday>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCorrectionEntryId, setSelectedCorrectionEntryId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<SummaryOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const tTimesheet = useTranslations("notifications.timesheet");
  const tHours = useTranslations("hoursPage");
  const tLegend = useTranslations("hoursPage.legend");
  const locale = useLocale();

  // Load timesheet entries, corrections, holidays, and monthly summary
  useEffect(() => {
    // Debug logging for admin context
    if (isAdmin) {
      console.log('[CalendarView] Loading data for admin view:', { employeeId, isAdmin, year, month });
    }
    
    loadTimesheetEntries();
    loadHolidays();
    loadMonthlySummary();
    if (isAdmin && employeeId) {
      loadCorrections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, employeeId, isAdmin]);

  // Handle deep-link hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      scrollToDateHash(hash);
    }
  }, []);

  // Load timesheet entries from database
  const loadTimesheetEntries = async () => {
    try {
      setIsLoading(true);
      // Always use employeeId when isAdmin is true
      const url = isAdmin && employeeId
        ? `/api/timesheet-entries?employeeId=${employeeId}`
        : '/api/timesheet-entries';
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to load timesheet entries: ${errorData.details || errorData.error}`);
      }
      
      const { data } = await response.json();
      
      // Convert database entries to DayEntry format.
      // Multiple entries per date are stored in an array so that, for example,
      // work + day-off can coexist on the same day.
      const entriesMap: Record<string, DayEntry[]> = {};
      data.forEach((entry: any) => {
        const dateStr = entry.date;

        // Normalize base fields from database
        let from: string | undefined = entry.time_from || undefined;
        let to: string | undefined = entry.time_to || undefined;
        const rawHours =
          typeof entry.hours_decimal === "number" && entry.hours_decimal > 0
            ? entry.hours_decimal
            : undefined;

        // Detect full-day day_off entries that use 00:00–00:01 as a technical placeholder.
        // For those, we hide the times in the UI but keep the hours (usually 8h).
        const isDayOff = entry.status === "day_off";
        const normalizedFrom = typeof from === "string" ? from.substring(0, 5) : "";
        const normalizedTo = typeof to === "string" ? to.substring(0, 5) : "";
        const isFullDayDayOff =
          isDayOff &&
          normalizedFrom === "00:00" &&
          normalizedTo === "00:01" &&
          typeof rawHours === "number" &&
          Math.abs(rawHours - 8) < 0.01;

        if (isFullDayDayOff) {
          from = undefined;
          to = undefined;
        }

        const mappedEntry: DayEntry = {
          id: entry.id,
          date: dateStr,
          from,
          to,
          pause: entry.break_minutes || 0,
          hours: rawHours,
          status:
            entry.status === "work"
              ? "arbeit"
              : entry.status === "vacation"
                ? "urlaub"
                : entry.status === "day_off"
                  ? "tagesbefreiung"
                  : "krank",
          note: entry.activity_note,
          comment: entry.comment,
          bauvorhaben: entry.project_name || "",
          taetigkeit: entry.activity_note,
          kommentar: entry.comment,
        };
        entriesMap[dateStr] = [...(entriesMap[dateStr] || []), mappedEntry];
      });
      
      setEntries(entriesMap);
    } catch (error) {
      console.error('Error loading timesheet entries:', error);
      showToast(tTimesheet("loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Load corrections for admin view
  const loadCorrections = async () => {
    if (!isAdmin || !employeeId) return;
    
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstDayISO = firstDay.toISOString().split('T')[0];
      const lastDayISO = lastDay.toISOString().split('T')[0];

      const response = await fetch(
        `/api/timesheet-corrections?employeeId=${employeeId}&startDate=${firstDayISO}&endDate=${lastDayISO}`
      );
      if (!response.ok) {
        console.error('Failed to load corrections');
        return;
      }
      
      const { data } = await response.json();
      
      // Group corrections by entry_id (show latest correction per entry)
      const correctionsMap: Record<string, Correction> = {};
      data.forEach((correction: Correction) => {
        const existing = correctionsMap[correction.entry_id];
        if (!existing || new Date(correction.created_at) > new Date(existing.created_at)) {
          correctionsMap[correction.entry_id] = correction;
        }
      });
      
      setCorrections(correctionsMap);
    } catch (error) {
      console.error('Error loading corrections:', error);
    }
  };

  // Load holidays for the current month
  const loadHolidays = async () => {
    try {
      const response = await fetch(`/api/holidays?year=${year}&month=${month}`);
      if (!response.ok) {
        console.error('Failed to load holidays:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      const data = result?.data || [];
      
      // Convert holidays array to map keyed by dateISO
      const holidaysMap: Record<string, Holiday> = {};
      if (data && Array.isArray(data)) {
        data.forEach((holiday: Holiday) => {
          holidaysMap[holiday.dateISO] = holiday;
        });
      }
      
      setHolidays(holidaysMap);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  // Load monthly summary
  const loadMonthlySummary = async () => {
    try {
      setIsLoadingSummary(true);
      const url = isAdmin && employeeId
        ? `/api/monthly-summary?employeeId=${employeeId}&year=${year}&month=${month}`
        : `/api/monthly-summary?year=${year}&month=${month}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to load monthly summary');
        return;
      }
      
      const result = await response.json();
      setMonthlySummary(result?.data || null);
    } catch (error) {
      console.error('Error loading monthly summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Get calendar grid
  const grid = getCalendarGrid(year, month);
  const weekDays = useMemo(() => {
    const monday = new Date(Date.UTC(2021, 0, 4));
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(monday.getTime() + index * 86400000))
    );
  }, [locale]);
  const monthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return formatter.format(new Date(year, month));
  }, [locale, year, month]);

  // Handle day click
  const handleDayClick = (day: number) => {
    const dateStr = formatDateISO(year, month, day);
    // Block clicks on blocked days (Sundays and weekday holidays)
    const holidaysSet = new Set(Object.keys(holidays));
    if (isBlockedDay(dateStr, holidaysSet)) {
      return;
    }
    setSelectedDate(dateStr);
  };

  // Handle save entry
  const handleSaveEntry = async (entry: DayEntry) => {
    try {
      setIsSaving(true);
      
      // Convert DayEntry to database format
      const status =
        entry.status === 'arbeit'
          ? 'work'
          : entry.status === 'urlaub'
            ? 'vacation'
            : entry.status === 'tagesbefreiung'
              ? 'day_off'
              : 'sick';
      const projectName = (entry.bauvorhaben || '').trim();
      
      const dbEntry = {
        date: entry.date,
        status,
        ...(status === 'work' && {
          time_from: entry.from,
          time_to: entry.to,
          break_minutes: entry.pause || 0,
          hours_decimal: entry.hours,
          activity_note: entry.note || entry.taetigkeit || '',
          project_name: projectName,
        }),
        ...((status === 'vacation' || status === 'sick') && {
          comment: entry.comment || entry.kommentar || '',
          time_from: '00:00',
          time_to: '00:01',
          break_minutes: 0,
          hours_decimal: 0,
          project_name: null,
        }),
        ...(status === 'day_off' && {
          time_from: entry.to ? entry.from : '00:00',
          time_to: entry.to ? entry.to : '00:01',
          break_minutes: 0,
          hours_decimal: entry.to ? (entry.hours ?? 0) : 8,
          activity_note: null,
          project_name: null,
          comment: null,
        }),
      };

      let response;
      if (entry.id) {
        response = await fetch(`/api/timesheet-entries/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbEntry),
        });
      } else {
        const url = isAdmin && employeeId
          ? `/api/timesheet-entries?employeeId=${employeeId}`
          : '/api/timesheet-entries';
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isAdmin && employeeId ? { ...dbEntry, employee_id: employeeId } : dbEntry),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to save timesheet entry: ${errorData.details || errorData.error}`);
      }

      await response.json();

      // Reload from database so local state (including multiple entries / corrections)
      // stays fully in sync.
      await loadTimesheetEntries();
      await loadMonthlySummary();
      if (isAdmin) {
        await loadCorrections();
      }

      showToast(tTimesheet("saveSuccess"));

      if (onEntrySave) {
        onEntrySave(entry);
      }
    } catch (error) {
      console.error('Error saving timesheet entry:', error);
      showToast(tTimesheet("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async () => {
    const dayEntries = selectedDate ? entries[selectedDate] || [] : [];
    const targetEntry = dayEntries[0];
    if (!selectedDate || !targetEntry?.id) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/timesheet-entries/${targetEntry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete timesheet entry');
      }

      // Reload from database to keep multiple entries and corrections in sync
      await loadTimesheetEntries();
      await loadMonthlySummary();
      showToast(tTimesheet("deleteSuccess"));
      if (isAdmin) {
        loadCorrections();
      }
      
      if (onEntryDelete) {
        onEntryDelete(targetEntry.id);
      }
    } catch (error) {
      console.error('Error deleting timesheet entry:', error);
      showToast(tTimesheet("deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save correction (admin only)
  const handleSaveCorrection = async (correctionData: any) => {
    try {
      console.log('[CalendarView] handleSaveCorrection called with:', correctionData);
      setIsSaving(true);
      
      const response = await fetch('/api/timesheet-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(correctionData),
      });

      console.log('[CalendarView] Correction API response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CalendarView] Correction API error:', errorData);
        throw new Error(`Failed to save correction: ${errorData.details || errorData.error}`);
      }

      const { data } = await response.json();
      console.log('[CalendarView] Correction saved successfully:', data);

      showToast(tTimesheet("correctionSaveSuccess"));
      
      // Reload entries, corrections, and summary to reflect changes
      await loadTimesheetEntries();
      await loadCorrections();
      await loadMonthlySummary();
      
      // Close correction dialog
      setSelectedCorrectionEntryId(null);
      
      if (onCorrectionSave) {
        onCorrectionSave(correctionData);
      }
    } catch (error) {
      console.error('[CalendarView] Error saving correction:', error);
      showToast(tTimesheet("correctionSaveError"));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle PDF export (admin only)
  const handleExportPDF = async () => {
    try {
      const monthStr = String(month + 1).padStart(2, '0');
      // Cache busting: append timestamp to force fresh fetch
      const url = `/api/pdf/monthly-report?employeeId=${employeeId}&year=${year}&month=${monthStr}&t=${Date.now()}`;
      
      const response = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${employeeName || 'Mitarbeiter'}_${year}-${monthStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      showToast(tTimesheet("pdfLoading"));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast(tTimesheet("pdfError"));
    }
  };

  // Show toast message
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Check if current month has any entries
  const hasEntriesThisMonth = Object.values(entries).some((dayEntries) =>
    dayEntries.some((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    })
  );

  return (
    <div>
      {/* Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={tHours("prevMonth")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h2 className="text-xl font-semibold">
            {monthLabel} {year}
          </h2>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={tHours("nextMonth")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6 bg-white border border-border rounded-lg p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="space-y-2">
          {grid.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIdx) => {
                if (day === null) {
                  return <div key={dayIdx} className="aspect-square" />;
                }

                const dateStr = formatDateISO(year, month, day);
                const dayEntries = entries[dateStr] || [];
                const workEntry = dayEntries.find((e) => e.status === "arbeit");
                const hasVacation = dayEntries.some((e) => e.status === "urlaub");
                const hasSick = dayEntries.some((e) => e.status === "krank");
                const hasDayOff = dayEntries.some((e) => e.status === "tagesbefreiung");
                const holiday = holidays[dateStr];
                const isTodayDate = isToday(year, month, day);
                const hasEntry = dayEntries.length > 0;
                const isHoliday = !!holiday;
                const holidaysSet = new Set(Object.keys(holidays));
                const isBlocked = isBlockedDay(dateStr, holidaysSet);
                const isSundayDate = isSunday(dateStr);
                const isWeekdayHoliday = isHoliday && !isSundayDate && !isWeekend(dateStr);
                const statusClass =
                  hasDayOff
                    ? "bg-blue-100 border-blue-500 text-blue-900"
                    : hasVacation
                      ? "bg-vacation-fill border-vacation-border text-brand"
                      : hasSick
                        ? "bg-red-100 border-red-500 text-red-900"
                        : workEntry
                          ? "bg-green-100 border-green-500 text-green-900"
                          : "";
                const correctionSource = workEntry ?? dayEntries[0];
                const correction = correctionSource?.id
                  ? corrections[correctionSource.id]
                  : undefined;
                const hasEndTime = !!workEntry?.to;
                const showWorkHours =
                  hasEntry &&
                  !!workEntry &&
                  hasEndTime &&
                  typeof workEntry?.hours === "number" &&
                  workEntry.hours > 0;
                const workHoursValue = showWorkHours ? (workEntry?.hours as number) : null;

                return (
                  <button
                    key={dayIdx}
                    id={`day-${dateStr}`}
                    onClick={() => handleDayClick(day)}
                    disabled={isBlocked}
                    title={
                      isBlocked
                        ? isWeekdayHoliday
                          ? "An Feiertagen können keine Einträge erstellt werden."
                          : "Sonntage sind immer frei; Einträge sind nicht erlaubt."
                        : isHoliday
                          ? tHours("holidayTooltip", { name: holiday.name })
                          : undefined
                    }
                    className={cn(
                      "aspect-square rounded-lg border-2 transition-all relative",
                      // Sunday: always disabled, grayed out, no hover
                      isSundayDate && "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60",
                      // Holiday styling: ALWAYS show blue/purple for holidays (takes priority over all entries)
                      !isSundayDate && isHoliday && "!border-brand bg-holiday-fill",
                      // Weekday holiday: also disabled (non-clickable)
                      isWeekdayHoliday && "cursor-not-allowed",
                      // Entry styling (only if NOT a holiday and not Sunday)
                      !isSundayDate && !isHoliday && hasEntry && statusClass,
                      // Non-blocked: normal interactions (only if not a holiday)
                      !isBlocked && !isHoliday && "hover:border-brand hover:shadow-sm",
                      !isBlocked && !isHoliday && "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                      // Today styling (if not a holiday and no entry and not Sunday)
                      !isSundayDate && !isHoliday && isTodayDate && !hasEntry && "border-brand bg-brand/5 font-bold",
                      // Today + holiday: apply holiday fill (already handled above, but ensure font-bold)
                      !isSundayDate && isTodayDate && isHoliday && "font-bold",
                      // Empty day (no entry, no holiday, not today, not Sunday)
                      !isSundayDate && !isTodayDate && !hasEntry && !isHoliday && "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className="text-sm">{day}</span>
                    {isTodayDate && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
                    )}
                    {isHoliday && (
                      <span
                        className={cn(
                          "absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-brand",
                          !hasEntry && "block",
                          hasEntry && "hidden"
                        )}
                      >
                        {tLegend("holiday")}
                      </span>
                    )}
                    {showWorkHours && workHoursValue !== null && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium">
                        {formatHours(workHoursValue)}h
                      </span>
                    )}
                    {isAdmin && correction && (
                      <span
                        className="absolute top-1 left-1 w-2 h-2 bg-red-600 rounded-full"
                        title={tLegend("correctionTooltip")}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-brand bg-brand/5 rounded" />
            <span className="text-muted-foreground">{tLegend("today")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-green-500 bg-green-100 rounded" />
            <span className="text-muted-foreground">{tLegend("work")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-vacation-border bg-vacation-fill rounded" />
            <span className="text-muted-foreground">{tLegend("vacation")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-red-500 bg-red-100 rounded" />
            <span className="text-muted-foreground">{tLegend("sick")}</span>
          </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 border-2 border-blue-500 bg-blue-100 rounded" />
          <span className="text-muted-foreground">{tLegend("dayOff")}</span>
        </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-brand bg-holiday-fill rounded" />
            <span className="text-muted-foreground">{tLegend("holiday")}</span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 border-2 border-red-600 bg-red-600 rounded-full" />
              <span className="text-muted-foreground">{tLegend("correction")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary Card */}
      <MonthlySummaryCard summary={monthlySummary} isLoading={isLoadingSummary} />

      {/* PDF Export Button (Admin only) */}
      {isAdmin && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">{tHours("exportPdf")}</span>
          </button>
        </div>
      )}

      {/* Monthly Overview List */}
      <MonthlyOverviewList
        year={year}
        month={month}
        employeeId={employeeId}
        isAdmin={isAdmin}
        entries={entries}
        corrections={corrections}
        holidays={holidays}
        onCorrectionSave={handleSaveCorrection}
        onRefresh={() => {
          loadTimesheetEntries();
          loadCorrections();
          loadMonthlySummary();
        }}
      />

      {/* Empty state */}
      {!hasEntriesThisMonth && (
        <div className="border border-border rounded-lg">
          <EmptyState message={tHours("empty")} />
        </div>
      )}

      {/* Day Entry Dialog */}
      {selectedDate && (
        <DayEntryDialog
          open={!!selectedDate}
          onOpenChange={(open) => !open && setSelectedDate(null)}
          date={selectedDate}
          initialData={(selectedDate ? entries[selectedDate] || [] : [])[0]}
          correction={(() => {
            const dayEntries = selectedDate ? entries[selectedDate] || [] : [];
            const workEntry = dayEntries.find((e) => e.status === "arbeit") ?? dayEntries[0];
            return workEntry?.id ? corrections[workEntry.id] : undefined;
          })()}
          isAdmin={isAdmin}
          onSave={handleSaveEntry}
          onDelete={(selectedDate && (entries[selectedDate] || []).length > 0) ? handleDeleteEntry : undefined}
          onCorrectionClick={() => {
            const dayEntries = selectedDate ? entries[selectedDate] || [] : [];
            const workEntry = dayEntries.find((e) => e.status === "arbeit") ?? dayEntries[0];
            if (workEntry?.id) {
              setSelectedCorrectionEntryId(workEntry.id);
            }            
          }}
          isLoading={isSaving}
        />
      )}

      {/* Admin Correction Dialog */}
      {isAdmin && selectedCorrectionEntryId && (() => {
        const entryForCorrection = Object.values(entries)
          .flat()
          .find(e => e.id === selectedCorrectionEntryId);
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-foreground text-background px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

