import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { diffCorrections } from "@/lib/utils/correctionDiff";
import { computeMonthlySummary } from "@/lib/logic/monthlySummary";
import { isSunday, isWeekend, isHoliday, holidayPaidHours } from "@/lib/date-utils";

// Ensure Node.js runtime for PDFKit
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDF Export API Route (Admin only)
 * Generates a monthly timesheet report PDF for a specific employee
 */

interface TimesheetEntry {
  id: string;
  date: string;
  status: "work" | "vacation" | "sick" | "day_off";
  time_from?: string;
  time_to?: string;
  break_minutes?: number;
  hours_decimal?: number;
  activity_note?: string;
  comment?: string;
  project_name?: string;
}

interface Correction {
  id: string;
  entry_id: string;
  corrected_time_from?: string;
  corrected_time_to?: string;
  corrected_break_minutes?: number;
  corrected_hours_decimal?: number;
  note?: string;
  created_at?: string;
}

interface Holiday {
  dateISO: string;
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("[PDF] Starting PDF export request");
    
    // Admin only - check auth manually (requireRole uses redirect which doesn't work in API routes)
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("[PDF] Unauthorized: No session");
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 403 }
      );
    }

    // Check profile and role for current user
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, active")
      .eq("id", session.user.id)
      .eq("active", true)
      .single();

    if (profileError || !profile) {
      console.error("[PDF] Unauthorized: Profile not found or inactive");
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 403 }
      );
    }

    if (profile.role !== "admin") {
      console.error("[PDF] Unauthorized: Not an admin");
      return NextResponse.json(
        { error: "Nicht autorisiert. Nur Administratoren können PDFs exportieren." },
        { status: 403 }
      );
    }
    console.log("[PDF] Admin session confirmed");

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const year = parseInt(searchParams.get("year") || "0", 10);
    const month = parseInt(searchParams.get("month") || "0", 10); // 1-12

    if (!employeeId || !year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "employeeId, year und month sind erforderlich." },
        { status: 400 }
      );
    }

    // Use admin client for data fetching to bypass RLS when exporting other employees
    const admin = getAdminClient();

    // Calculate date range
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Fetch employee profile
    const { data: employee, error: employeeError } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", employeeId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Mitarbeiter nicht gefunden." },
        { status: 404 }
      );
    }

    // Fetch timesheet entries for the month
    const { data: entries, error: entriesError } = await admin
      .from("timesheet_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date", firstDay.toISOString().split("T")[0])
      .lte("date", lastDay.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (entriesError) {
      console.error("[PDF] Error fetching entries:", entriesError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Einträge." },
        { status: 500 }
      );
    }

    // Fetch corrections for these entries
    const entryIds = entries?.map((e) => e.id) || [];
    let correctionsMap: Record<string, Correction> = {};

    if (entryIds.length > 0) {
      const { data: corrections, error: correctionsError } = await admin
        .from("timesheet_corrections")
        .select("*")
        .in("entry_id", entryIds)
        .order("created_at", { ascending: false });

      if (!correctionsError && corrections) {
        // Group by entry_id, keeping only the latest
        corrections.forEach((corr) => {
          if (!correctionsMap[corr.entry_id]) {
            correctionsMap[corr.entry_id] = corr;
          }
        });
      }
    }

    // Fetch holidays for the month
    const { data: holidays, error: holidaysError } = await admin
      .from("holidays")
      .select("holiday_date, name")
      .gte("holiday_date", firstDay.toISOString().split("T")[0])
      .lte("holiday_date", lastDay.toISOString().split("T")[0]);

    const holidaysMap: Record<string, string> = {};
    if (!holidaysError && holidays) {
      holidays.forEach((h) => {
        holidaysMap[h.holiday_date] = h.name;
      });
    }

    // Build effective per-day entries (merge corrections)
    const holidaysSet = new Set(Object.keys(holidaysMap));
    const daysInMonth = lastDay.getDate();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    type EffectiveEntry = {
      dateISO: string;
      note: string;
      status: 'work' | 'vacation' | 'sick' | 'day_off' | 'none';
      workHours: number; // decimal hours
      vacationHours: number; // decimal hours
      sickHours: number; // decimal hours
      holidayHours: number; // decimal hours (paid holiday hours)
      dayOffHours: number; // decimal hours (Tagesbefreiung)
      isHolidayWork: boolean;
    };

    // Build quick lookup by date for entries and corrections (latest)
    // Note: Multiple entries per date are possible (e.g., Arbeit + Tagesbefreiung)
    const entriesByDate = new Map<string, TimesheetEntry[]>();
    (entries || []).forEach((e) => {
      const existing = entriesByDate.get(e.date) || [];
      existing.push(e);
      entriesByDate.set(e.date, existing);
    });

    const latestCorrectionByEntryId = new Map<string, Correction>();
    Object.values(correctionsMap).forEach((c) => {
      const existing = latestCorrectionByEntryId.get(c.entry_id);
      if (!existing) {
        latestCorrectionByEntryId.set(c.entry_id, c);
      } else if (c.created_at && (!existing.created_at || new Date(c.created_at) > new Date(existing.created_at))) {
        latestCorrectionByEntryId.set(c.entry_id, c);
      }
    });

    const effectiveEntries: EffectiveEntry[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${pad2(month)}-${pad2(day)}`;
      const dayEntries = entriesByDate.get(dateISO) || [];
      
      // Process all entries for this day
      let workHours = 0;
      let vacationHours = 0;
      let sickHours = 0;
      let dayOffHours = 0;
      let noteParts: string[] = [];
      let isHolidayWork = false;

      for (const entry of dayEntries) {
        const correction = latestCorrectionByEntryId.get(entry.id);
        const correctedHours = correction?.corrected_hours_decimal ?? undefined;
        const hoursDecimal = correctedHours ?? entry?.hours_decimal ?? 0;
        
        if (entry.status === 'work') {
          workHours += hoursDecimal;
          const project = entry?.project_name ? `Bauvorhaben: ${entry.project_name}` : '';
          const baseNote = correction?.note || entry?.activity_note || entry?.comment || '';
          if (project) noteParts.push(project);
          if (baseNote) noteParts.push(baseNote);
          const isHoliday = holidaysSet.has(dateISO);
          if (isHoliday && hoursDecimal > 0) {
            isHolidayWork = true;
          }
        } else if (entry.status === 'vacation') {
          vacationHours = 8.0; // Full day vacation
        } else if (entry.status === 'sick') {
          sickHours = 8.0; // Full day sick
        } else if (entry.status === 'day_off') {
          dayOffHours += hoursDecimal; // Can be partial or full day
          const baseNote = correction?.note || entry?.activity_note || entry?.comment || '';
          if (baseNote) noteParts.push(baseNote);
        }
      }

      // Calculate holiday paid hours (8h for Mon-Fri holidays, 0h for Sat/Sun holidays)
      // This shows the paid hours for holidays, regardless of whether there's work or not
      const holidayHours = holidayPaidHours(dateISO, holidaysSet);

      const note = noteParts.filter((part) => part && part.trim().length > 0).join('\n');
      const primaryStatus = dayEntries.length > 0 ? (dayEntries[0].status as any) : 'none';

      const effective: EffectiveEntry = {
        dateISO,
        note,
        status: primaryStatus,
        workHours,
        vacationHours,
        sickHours,
        holidayHours,
        dayOffHours,
        isHolidayWork,
      };
      effectiveEntries.push(effective);
    }

    // Compute summary from effective entries
    const summary = {
      totalMinutes: Math.round(effectiveEntries.reduce((acc, d) => acc + (d.workHours + d.vacationHours + d.sickHours) * 60, 0)),
      workMinutes: Math.round(effectiveEntries.reduce((acc, d) => acc + d.workHours * 60, 0)),
      sickMinutes: Math.round(effectiveEntries.reduce((acc, d) => acc + d.sickHours * 60, 0)),
      vacationMinutes: Math.round(effectiveEntries.reduce((acc, d) => acc + d.vacationHours * 60, 0)),
      holidayMinutes: Math.round(effectiveEntries.reduce((acc, d) => acc + (d.isHolidayWork ? d.workHours * 60 : 0), 0)),
    };

    // Generate PDF via @react-pdf/renderer (avoids font file issues)
    console.log("[PDF] Starting PDF generation (react-pdf)");

    const styles = StyleSheet.create({
      page: { padding: 32, fontSize: 10 },
      header: { marginBottom: 12 },
      title: { fontSize: 16, marginBottom: 4 },
      subtitle: { fontSize: 12, color: '#444' },
      sectionTitle: { fontSize: 12, marginTop: 12, marginBottom: 6 },
      divider: { height: 1, backgroundColor: '#999', marginVertical: 8 },
      table: { display: 'flex', flexDirection: 'column', borderWidth: 1, borderColor: '#ccc' },
      tableRow: { display: 'flex', flexDirection: 'row' },
      th: { padding: 6, fontSize: 10, fontWeight: 700, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#ccc', backgroundColor: '#f7f7f7' },
      td: { padding: 6, fontSize: 10, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' },
      colDay: { width: 50 },
      colDayHoliday: { width: 50, backgroundColor: '#ffc0cb' }, // Pink for holidays
      colDayWeekend: { width: 50, backgroundColor: '#add8e6' }, // Blue for weekends
      colWork: { width: 90, textAlign: 'right' },
      colVacation: { width: 90, textAlign: 'right' },
      colSick: { width: 90, textAlign: 'right' },
      colHoliday: { width: 90, textAlign: 'right' },
      colDayOff: { width: 100, textAlign: 'right' },
      colNote: { width: 180 },
      summaryRow: { display: 'flex', flexDirection: 'row', marginTop: 10 },
      cellLabel: { width: 160, color: '#333' },
      cellValue: { width: 140 },
    });

    const formatMinutes = (mins: number): string => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h} h ${m} min`;
    };

    // Helper to create multi-line header text with explicit line breaks
    const createMultiLineHeader = (line1: string, line2: string, styleArray: any[]) => {
      // Find textAlign from column style (e.g., colWork has textAlign: 'right')
      const columnStyle = styleArray.find((s: any) => s?.textAlign);
      const textAlign = columnStyle?.textAlign || 'center';
      
      // Merge all styles for the container View
      const containerStyle = [
        styles.th, // Base header style (padding, borders, background)
        ...styleArray.filter((s: any) => s !== styles.th && !s?.textAlign), // Column width styles
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: textAlign === 'right' ? 'flex-end' : textAlign === 'left' ? 'flex-start' : 'center',
        }
      ];
      
      return React.createElement(View, { style: containerStyle },
        React.createElement(Text, { style: { fontSize: 10, fontWeight: 700, textAlign } }, line1),
        React.createElement(Text, { style: { fontSize: 10, fontWeight: 700, textAlign } }, line2)
      );
    };

    const docElement = React.createElement(Document, null,
      React.createElement(Page, { size: 'A4', style: styles.page },
        React.createElement(View, { style: styles.header },
          React.createElement(Text, { style: styles.title }, 'Tetrasan – Monatliche Stundenerfassung'),
          React.createElement(Text, { style: styles.subtitle }, `${employee.full_name || employee.email} – ${getMonthName(month - 1)} ${year}`),
        ),
        React.createElement(View, { style: styles.divider }),
        React.createElement(Text, { style: styles.sectionTitle }, 'Tageseinträge'),
        React.createElement(View, { style: styles.table },
          React.createElement(View, { style: styles.tableRow },
            React.createElement(Text, { style: [styles.th, styles.colDay] }, 'Tag'),
            createMultiLineHeader('Arbeits-', 'stunden', [styles.th, styles.colWork]),
            createMultiLineHeader('Urlaubs-', 'stunden', [styles.th, styles.colVacation]),
            createMultiLineHeader('Krankheits-', 'stunden', [styles.th, styles.colSick]),
            createMultiLineHeader('Feiertags-', 'stunden', [styles.th, styles.colHoliday]),
            createMultiLineHeader('Tages-', 'befreiung', [styles.th, styles.colDayOff]),
            React.createElement(Text, { style: [styles.th, styles.colNote] }, 'Notiz'),
          ),
          ...effectiveEntries.map((d) => {
            // Determine day type for background color in "Tag" column
            // Priority: Sunday always blue, Saturday+holiday = pink, Saturday = blue, weekday+holiday = pink
            const isHolidayDate = isHoliday(d.dateISO, holidaysSet);
            const isSundayDate = isSunday(d.dateISO);
            const isWeekendDate = isWeekend(d.dateISO);
            
            // Determine background color for "Tag" cell
            let tagCellStyle = styles.colDay;
            if (isSundayDate) {
              // Sunday: always blue (weekend), even if holiday
              tagCellStyle = styles.colDayWeekend;
            } else if (isHolidayDate && isWeekendDate) {
              // Saturday + holiday: pink (holiday takes priority)
              tagCellStyle = styles.colDayHoliday;
            } else if (isWeekendDate) {
              // Saturday (no holiday): blue
              tagCellStyle = styles.colDayWeekend;
            } else if (isHolidayDate) {
              // Weekday + holiday: pink
              tagCellStyle = styles.colDayHoliday;
            }
            
            return React.createElement(View, { key: d.dateISO, style: d.isHolidayWork ? [styles.tableRow, { backgroundColor: '#f1f3f5' }] : styles.tableRow },
              React.createElement(Text, { style: [styles.td, tagCellStyle] }, String(new Date(d.dateISO + 'T00:00:00Z').getUTCDate())),
              React.createElement(Text, { style: [styles.td, styles.colWork] }, d.workHours ? d.workHours.toFixed(1).replace('.', ',') : ''),
              React.createElement(Text, { style: [styles.td, styles.colVacation] }, d.vacationHours ? d.vacationHours.toFixed(1).replace('.', ',') : ''),
              React.createElement(Text, { style: [styles.td, styles.colSick] }, d.sickHours ? d.sickHours.toFixed(1).replace('.', ',') : ''),
              React.createElement(Text, { style: [styles.td, styles.colHoliday] }, d.holidayHours ? d.holidayHours.toFixed(1).replace('.', ',') : ''),
              React.createElement(Text, { style: [styles.td, styles.colDayOff] }, d.dayOffHours ? d.dayOffHours.toFixed(1).replace('.', ',') : ''),
              React.createElement(Text, { style: [styles.td, styles.colNote] }, d.note || ''),
            );
          })
        ),
        React.createElement(View, { style: styles.divider }),
        React.createElement(Text, { style: styles.sectionTitle }, 'Zusammenfassung'),
        React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.cellLabel }, 'Gesamtstunden:'), React.createElement(Text, { style: styles.cellValue }, formatMinutes(summary.totalMinutes || 0))),
        React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.cellLabel }, 'Arbeit:'), React.createElement(Text, { style: styles.cellValue }, formatMinutes(summary.workMinutes || 0))),
        React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.cellLabel }, 'Krank:'), React.createElement(Text, { style: styles.cellValue }, formatMinutes(summary.sickMinutes || 0))),
        React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.cellLabel }, 'Urlaub:'), React.createElement(Text, { style: styles.cellValue }, formatMinutes(summary.vacationMinutes || 0))),
        React.createElement(View, { style: styles.summaryRow }, React.createElement(Text, { style: styles.cellLabel }, 'Feiertag:'), React.createElement(Text, { style: styles.cellValue }, formatMinutes(summary.holidayMinutes || 0))),
        React.createElement(View, { style: { marginTop: 12 } }, React.createElement(Text, null, `Freigegeben durch Admin: ____________________   Datum: ${new Date().toLocaleDateString('de-DE')}`))
      )
    );

    const pdfBuffer = await renderToBuffer(docElement);
    const filename = `Tetrasan_Monatsbericht_${employee.full_name?.replace(/\s+/g, '_') || employee.email}_${year}-${String(month).padStart(2, '0')}.pdf`;
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[PDF] Unexpected error:", error);
    if (error instanceof Error) {
      console.error("[PDF] Error message:", error.message);
      console.error("[PDF] Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Fehler beim Erstellen des PDFs.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper functions
function getMonthName(monthIndex: number): string {
  const months = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  return months[monthIndex];
}

function formatDateDE(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatTimeRange(from: string, to: string): string {
  // Normalize time format
  let normFrom = from;
  let normTo = to;
  if (normFrom.length === 5) normFrom = `${normFrom}:00`;
  if (normTo.length === 5) normTo = `${normTo}:00`;
  return `${normFrom} - ${normTo}`;
}

function getStatusLabel(
  status: "work" | "vacation" | "sick",
  isHoliday: boolean
): string {
  if (isHoliday && status === "work") return "Feiertag";
  switch (status) {
    case "work":
      return "Arbeit";
    case "vacation":
      return "Urlaub";
    case "sick":
      return "Krank";
    default:
      return "Arbeit";
  }
}

