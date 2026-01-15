"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DayEntryDialog } from "@/components/employee/hours/DayEntryDialog";
import { useMonthState } from "@/components/employee/hours/useMonthState";
import { DayEntry, MonthSummary } from "@/components/employee/hours/types";
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
import { ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlySummaryCard } from "@/components/summary/MonthlySummaryCard";
import { SummaryOutput } from "@/lib/logic/monthlySummary";

/**
 * Employee Hours Page
 * Monthly calendar view with day entry modal
 * Features:
 * - Monthly calendar grid
 * - Today highlighted
 * - Month navigation
 * - Click day to open entry modal
 * - Deep-link support (?month=YYYY-MM, #YYYY-MM-DD)
 * - Monthly summary (total hours, vacation/sick days)
 */
interface Holiday {
  dateISO: string;
  name: string;
}

function HoursPageContent() {
  const locale = useLocale();
  const tTimesheet = useTranslations("notifications.timesheet");
  const tHours = useTranslations("hoursPage");
  const tLegend = useTranslations("hoursPage.legend");
  const { year, month, goToPreviousMonth, goToNextMonth } = useMonthState();
  // Multiple entries (work, vacation, sick, day-off) can exist on the same date.
  const [entries, setEntries] = useState<Record<string, DayEntry[]>>({});
  const [holidays, setHolidays] = useState<Record<string, Holiday>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<SummaryOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Calculate monthly summary (day-off entries are not counted in totals for now).
  const summary: MonthSummary = Object.values(entries)
    .flat()
    .reduce(
      (acc, entry) => {
        // Check if entry is in current month
        const entryDate = new Date(entry.date);
        if (entryDate.getFullYear() !== year || entryDate.getMonth() !== month) {
          return acc;
        }

        if (entry.status === "arbeit" && entry.hours) {
          acc.totalHours += entry.hours;
        } else if (entry.status === "urlaub") {
          acc.vacationDays += 1;
        } else if (entry.status === "krank") {
          acc.sickDays += 1;
        }
        return acc;
      },
      { totalHours: 0, vacationDays: 0, sickDays: 0 }
    );

  // Check if current month has any entries
  const hasEntriesThisMonth = Object.values(entries).some((dayEntries) =>
    dayEntries.some((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    })
  );

  // Load timesheet entries, holidays, and monthly summary from database
  useEffect(() => {
    loadTimesheetEntries();
    loadHolidays();
    loadMonthlySummary();
  }, [year, month]);

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
      const response = await fetch('/api/timesheet-entries');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to load timesheet entries: ${errorData.details || errorData.error}`);
      }
      
      const { data } = await response.json();
      
      // Convert database entries to DayEntry format.
      // Multiple entries per date are stored in an array so that e.g.
      // work + day-off can coexist.
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
          // Hide technical placeholder times in the UI for full-day exemptions
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
          bauvorhaben: entry.project_name || '',
          taetigkeit: entry.activity_note, // Keep both for compatibility
          kommentar: entry.comment, // Keep both for compatibility
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
      
      console.log(`[loadHolidays] Loaded ${data.length} holidays for ${year}-${month}:`, data);
      
      // Convert holidays array to map keyed by dateISO
      const holidaysMap: Record<string, Holiday> = {};
      if (data && Array.isArray(data)) {
        data.forEach((holiday: Holiday) => {
          holidaysMap[holiday.dateISO] = holiday;
        });
      }
      
      console.log(`[loadHolidays] Holidays map:`, holidaysMap);
      setHolidays(holidaysMap);
    } catch (error) {
      console.error('Error loading holidays:', error);
      // Silently fail - holidays are optional
    }
  };

  // Load monthly summary
  const loadMonthlySummary = async () => {
    try {
      setIsLoadingSummary(true);
      const response = await fetch(`/api/monthly-summary?year=${year}&month=${month}`);
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
    const monday = new Date(Date.UTC(2021, 0, 4)); // Monday
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
      const projectName = (entry.bauvorhaben || "").trim();
      const activityNote = (entry.note ?? entry.taetigkeit ?? "").trim();

      // Helper to map a single DayEntry + date to the API payload
      const buildDbEntryForDate = (singleDate: string) => {
        const status =
          entry.status === "arbeit"
            ? "work"
            : entry.status === "urlaub"
              ? "vacation"
              : entry.status === "tagesbefreiung"
                ? "day_off"
                : "sick";

        return {
          date: singleDate,
          status,
          // For work status, include time fields
          ...(status === "work" && {
            time_from: entry.from,
            time_to: entry.to ?? null,
            break_minutes: entry.pause ?? 0,
            hours_decimal: entry.hours ?? 0,
            activity_note: activityNote || null,
            project_name: projectName || null,
          }),
          // For day_off, allow optional time range and store 8h if full-day
          ...(status === "day_off" && {
            time_from: entry.to ? entry.from : "00:00",
            time_to: entry.to ? entry.to : "00:01",
            break_minutes: 0,
            hours_decimal: entry.to ? (entry.hours ?? 0) : 8,
            activity_note: null,
            project_name: null,
            comment: null,
          }),
          // For vacation/sick status, include comment
          ...((status === "vacation" || status === "sick") && {
            comment: entry.comment || entry.kommentar || "",
            // Set default values for required fields (time_to must be > time_from)
            time_from: "00:00",
            time_to: "00:01",
            break_minutes: 0,
            hours_decimal: 0,
            project_name: null,
          }),
        };
      };

      // Special handling: Urlaub created from the Stunden modal can be a date range.
      // In that case, create/update one vacation entry per day in the range.
      if (
        entry.status === "urlaub" &&
        entry.rangeStart &&
        entry.rangeEnd &&
        !entry.id
      ) {
        const start = new Date(entry.rangeStart);
        const end = new Date(entry.rangeEnd);

        // Normalise times to midnight to avoid DST issues
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (start > end) {
          throw new Error("Invalid vacation date range");
        }

        // Helper to format date as YYYY-MM-DD in local time (not UTC)
        const formatDateLocal = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        // Collect valid dates (excluding blocked days: Sundays and weekday holidays) first
        const holidaysSet = new Set(Object.keys(holidays));
        const validDates: string[] = [];
        for (
          let d = new Date(start.getTime());
          d <= end;
          d.setDate(d.getDate() + 1)
        ) {
          const isoDate = formatDateLocal(d); // YYYY-MM-DD in local time
          // Skip blocked days (Sundays and weekday holidays) - they cannot be vacation
          if (!isBlockedDay(isoDate, holidaysSet)) {
            validDates.push(isoDate);
          }
        }

        // Validate that we have at least one valid day
        if (validDates.length === 0) {
          throw new Error("Keine gültigen Tage im Zeitraum. Sonntage und Feiertage sind immer frei und können nicht als Urlaub markiert werden.");
        }

        // Create entries for all valid dates (excluding Sundays)
        for (const isoDate of validDates) {
          const dbEntryForDay = buildDbEntryForDate(isoDate);
          const response = await fetch("/api/timesheet-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dbEntryForDay),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API Error (vacation range):", errorData);
            throw new Error(
              `Failed to save vacation entry: ${
                errorData.details || errorData.error || response.statusText
              }`
            );
          }
        }
      } else {
        // Default behaviour: single-day entry (work, sick, day_off, or existing Urlaub)
        const dbEntry = buildDbEntryForDate(entry.date);

        let response;
        if (entry.id) {
          // Update existing entry
          response = await fetch(`/api/timesheet-entries/${entry.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dbEntry),
          });
        } else {
          // Create new entry
          response = await fetch("/api/timesheet-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dbEntry),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(
            `Failed to save timesheet entry: ${
              errorData.details || errorData.error
            }`
          );
        }

        await response.json();
      }
      
      showToast(tTimesheet("saveSuccess"));
      
      // Reload entries from database to ensure state is in sync
      // This ensures we have the correct entry ID and prevents duplicates
      await loadTimesheetEntries();
      
      // Reload summary after saving
      loadMonthlySummary();
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

      // Reload entries from database so all statuses (work, vacation, day-off) stay in sync
      await loadTimesheetEntries();
      
      showToast(tTimesheet("deleteSuccess"));
      // Reload summary after deleting
      loadMonthlySummary();
    } catch (error) {
      console.error('Error deleting timesheet entry:', error);
      showToast(tTimesheet("deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

  // Show toast message
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      <PageHeader title={tHours("title")} />

      {/* Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
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
                      // Blocked days (Sunday or weekday holiday): disabled, grayed out, no hover
                      isBlocked && "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60",
                      // Non-blocked: normal interactions
                      !isBlocked && "hover:border-brand hover:shadow-sm",
                      !isBlocked && "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                      // Entry styling first (if there's an entry and not blocked)
                      // Note: Entries should not exist on blocked days, but handle gracefully
                      !isBlocked && hasEntry && statusClass,
                      // Holiday border: ALWAYS show blue border if it's a holiday (overrides entry border, but not blocked)
                      !isBlocked && isHoliday && "!border-brand",
                      // Holiday fill: show blue fill if holiday and no entry (more saturated blue)
                      !isBlocked && isHoliday && !hasEntry && "bg-holiday-fill",
                      // Holiday with entry: show subtle blue tint on top of entry color
                      !isBlocked && isHoliday && hasEntry && "bg-holiday-fill/40",
                      // Today styling (if not a holiday and no entry and not blocked)
                      !isBlocked && isTodayDate && !hasEntry && !isHoliday && "border-brand bg-brand/5 font-bold",
                      // Today + holiday: apply holiday fill
                      !isBlocked && isTodayDate && isHoliday && !hasEntry && "bg-holiday-fill font-bold",
                      // Empty day (no entry, no holiday, not today, not blocked)
                      !isBlocked && !isTodayDate && !hasEntry && !isHoliday && "border-border hover:bg-muted/50"
                    )}
                  >
                    {/* Mobile layout: stacked content to avoid overlap */}
                    <div className="flex h-full w-full flex-col items-center justify-between md:hidden py-1">
                      <div className="text-[11px] font-medium text-black self-start pl-1 pt-0.5">{day}</div>
                      {/* Show hours if there's a work entry (holidays with work entries will show hours too) */}
                      {showWorkHours && workHoursValue !== null && (
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {formatHours(workHoursValue)}h
                        </div>
                      )}
                      {/* No "Feiertag" text in holiday cells - only day number and optional hours */}
                    </div>

                    {/* Desktop layout: keep absolute positioning */}
                    <div className="hidden md:block">
                      <span className="text-sm font-medium text-black">{day}</span>
                      {isTodayDate && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
                      )}
                      {/* No "Feiertag" text in holiday cells - only show hours if present */}
                      {showWorkHours && workHoursValue !== null && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
                          {formatHours(workHoursValue)}h
                        </span>
                      )}
                    </div>
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
        </div>
      </div>

      {/* Monthly Summary Card */}
      <MonthlySummaryCard summary={monthlySummary} isLoading={isLoadingSummary} />

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
          onSave={handleSaveEntry}
          onDelete={(selectedDate && (entries[selectedDate] || []).length > 0) ? handleDeleteEntry : undefined}
          isLoading={isSaving}
        />
      )}

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

export default function EmployeeHoursPage() {
  const tHours = useTranslations("hoursPage");
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">{tHours("loading")}</div>}>
      <HoursPageContent />
    </Suspense>
  );
}
