"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DayEntryDialog } from "@/components/employee/hours/DayEntryDialog";
import { useMonthState } from "@/components/employee/hours/useMonthState";
import { DayEntry, MonthSummary } from "@/components/employee/hours/types";
import { scrollToDateHash } from "@/components/employee/hours/dateAnchors";
import {
  getCalendarGrid,
  getMonthName,
  getDayName,
  isToday,
  formatDateISO,
  formatHours,
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
  const { year, month, goToPreviousMonth, goToNextMonth } = useMonthState();
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});
  const [holidays, setHolidays] = useState<Record<string, Holiday>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<SummaryOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Calculate monthly summary
  const summary: MonthSummary = Object.values(entries).reduce(
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
  const hasEntriesThisMonth = Object.keys(entries).some((date) => {
    const entryDate = new Date(date);
    return entryDate.getFullYear() === year && entryDate.getMonth() === month;
  });

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
      
      // Convert database entries to DayEntry format
      const entriesMap: Record<string, DayEntry> = {};
      data.forEach((entry: any) => {
        const dateStr = entry.date;
        entriesMap[dateStr] = {
          id: entry.id,
          date: dateStr,
          from: entry.time_from,
          to: entry.time_to,
          pause: entry.break_minutes || 0,
          hours: entry.hours_decimal,
          status: entry.status === 'work' ? 'arbeit' : entry.status === 'vacation' ? 'urlaub' : 'krank',
          note: entry.activity_note,
          comment: entry.comment,
          bauvorhaben: entry.project_name || '',
          taetigkeit: entry.activity_note, // Keep both for compatibility
          kommentar: entry.comment, // Keep both for compatibility
        };
      });
      
      setEntries(entriesMap);
    } catch (error) {
      console.error('Error loading timesheet entries:', error);
      showToast('Fehler beim Laden der Zeiteinträge');
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
  const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  // Handle day click
  const handleDayClick = (day: number) => {
    const dateStr = formatDateISO(year, month, day);
    setSelectedDate(dateStr);
  };

  // Handle save entry
  const handleSaveEntry = async (entry: DayEntry) => {
    try {
      setIsSaving(true);
      
      // Convert DayEntry to database format
      const status = entry.status === 'arbeit' ? 'work' : entry.status === 'urlaub' ? 'vacation' : 'sick';
      const projectName = (entry.bauvorhaben || '').trim();
      
      const dbEntry = {
        date: entry.date,
        status,
        // For work status, include time fields
        ...(status === 'work' && {
          time_from: entry.from,
          time_to: entry.to ?? null,
          break_minutes: entry.pause ?? 0,
          hours_decimal: entry.hours ?? null,
          activity_note: entry.note ?? entry.taetigkeit ?? null,
          project_name: projectName || null,
        }),
        // For vacation/sick status, include comment
        ...((status === 'vacation' || status === 'sick') && {
          comment: entry.comment || entry.kommentar || '',
          // Set default values for required fields (time_to must be > time_from)
          time_from: '00:00',
          time_to: '00:01',
          break_minutes: 0,
          hours_decimal: 0,
          project_name: null,
        }),
      };

      let response;
      if (entry.id) {
        // Update existing entry
        response = await fetch(`/api/timesheet-entries/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbEntry),
        });
      } else {
        // Create new entry
        response = await fetch('/api/timesheet-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbEntry),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to save timesheet entry: ${errorData.details || errorData.error}`);
      }

      const { data } = await response.json();
      
      showToast("Gespeichert");
      
      // Reload entries from database to ensure state is in sync
      // This ensures we have the correct entry ID and prevents duplicates
      await loadTimesheetEntries();
      
      // Reload summary after saving
      loadMonthlySummary();
    } catch (error) {
      console.error('Error saving timesheet entry:', error);
      showToast('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async () => {
    if (!selectedDate || !entries[selectedDate]?.id) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/timesheet-entries/${entries[selectedDate].id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete timesheet entry');
      }

      // Update local state
      setEntries((prev) => {
        const newEntries = { ...prev };
        delete newEntries[selectedDate!];
        return newEntries;
      });
      
      showToast("Gelöscht");
      // Reload summary after deleting
      loadMonthlySummary();
    } catch (error) {
      console.error('Error deleting timesheet entry:', error);
      showToast('Fehler beim Löschen');
    } finally {
      setIsSaving(false);
    }
  };

  // Show toast message
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Get status badge color for a day
  const getDayStatusClass = (dateStr: string) => {
    const entry = entries[dateStr];
    if (!entry) return "";

    if (entry.status === "arbeit") return "bg-green-100 border-green-500 text-green-900";
    if (entry.status === "urlaub") return "bg-vacation-fill border-vacation-border text-brand";
    if (entry.status === "krank") return "bg-red-100 border-red-500 text-red-900";
    return "";
  };

  return (
    <div>
      <PageHeader title="Stunden" />

      {/* Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold">
          {getMonthName(month)} {year}
        </h2>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Nächster Monat"
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
                const entry = entries[dateStr];
                const holiday = holidays[dateStr];
                const isTodayDate = isToday(year, month, day);
                const hasEntry = !!entry;
                const isHoliday = !!holiday;
                const statusClass = getDayStatusClass(dateStr);
                

                return (
                  <button
                    key={dayIdx}
                    id={`day-${dateStr}`}
                    onClick={() => handleDayClick(day)}
                    title={isHoliday ? `Feiertag: ${holiday.name}` : undefined}
                    className={cn(
                      "aspect-square rounded-lg border-2 transition-all relative",
                      "hover:border-brand hover:shadow-sm",
                      "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                      // Entry styling first (if there's an entry)
                      hasEntry && statusClass,
                      // Holiday border: ALWAYS show blue border if it's a holiday (overrides entry border)
                      isHoliday && "!border-brand",
                      // Holiday fill: show blue fill if holiday and no entry (more saturated blue)
                      isHoliday && !hasEntry && "bg-holiday-fill",
                      // Holiday with entry: show subtle blue tint on top of entry color
                      isHoliday && hasEntry && "bg-holiday-fill/40",
                      // Today styling (if not a holiday and no entry)
                      isTodayDate && !hasEntry && !isHoliday && "border-brand bg-brand/5 font-bold",
                      // Today + holiday: apply holiday fill
                      isTodayDate && isHoliday && !hasEntry && "bg-holiday-fill font-bold",
                      // Empty day (no entry, no holiday, not today)
                      !isTodayDate && !hasEntry && !isHoliday && "border-border hover:bg-muted/50"
                    )}
                  >
                    {/* Mobile layout: stacked content to avoid overlap */}
                    <div className="flex h-full w-full flex-col items-center justify-between md:hidden py-1">
                      <div className="text-[11px] font-medium text-black self-start pl-1 pt-0.5">{day}</div>
                      {/* Show hours if there's a work entry (holidays with work entries will show hours too) */}
                      {hasEntry && entry.status === "arbeit" && entry.hours && (
                        <div className="text-[11px] font-medium text-muted-foreground">{formatHours(entry.hours)}h</div>
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
                      {hasEntry && entry.status === "arbeit" && entry.hours && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
                          {formatHours(entry.hours)}h
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
            <div className="w-4 h-4 border-2 border-green-500 bg-green-100 rounded" />
            <span className="text-muted-foreground">Arbeit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-vacation-border bg-vacation-fill rounded" />
            <span className="text-muted-foreground">Urlaub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-red-500 bg-red-100 rounded" />
            <span className="text-muted-foreground">Krank</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 border-2 border-brand bg-holiday-fill rounded" />
            <span className="text-muted-foreground">Feiertag</span>
          </div>
        </div>
      </div>

      {/* Monthly Summary Card */}
      <MonthlySummaryCard summary={monthlySummary} isLoading={isLoadingSummary} />

      {/* Empty state */}
      {!hasEntriesThisMonth && (
        <div className="border border-border rounded-lg">
          <EmptyState message="Noch keine Einträge in diesem Monat" />
        </div>
      )}

      {/* Day Entry Dialog */}
      {selectedDate && (
        <DayEntryDialog
          open={!!selectedDate}
          onOpenChange={(open) => !open && setSelectedDate(null)}
          date={selectedDate}
          initialData={entries[selectedDate]}
          onSave={handleSaveEntry}
          onDelete={entries[selectedDate] ? handleDeleteEntry : undefined}
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
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Lädt…</div>}>
      <HoursPageContent />
    </Suspense>
  );
}
