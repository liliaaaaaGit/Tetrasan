/**
 * Date utilities for calendar and time calculations
 * Locale: de-DE, Timezone: Europe/Berlin
 */

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get month name in German
 */
export function getMonthName(month: number): string {
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];
  return months[month];
}

/**
 * Get day name in German (short)
 */
export function getDayName(day: number): string {
  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  return days[day];
}

/**
 * Check if a date is today
 */
export function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(year: number, month: number, day: number): string {
  const monthStr = String(month + 1).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Format date as DD.MM.YYYY (German format)
 */
export function formatDateDE(year: number, month: number, day: number): string {
  const monthStr = String(month + 1).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${dayStr}.${monthStr}.${year}`;
}

/**
 * Format an ISO timestamp to 'dd.MM.yyyy, HH:mm' in Europe/Berlin
 */
export function formatDateTimeDe(iso: string): string {
  if (!iso) return "";
  const dt = new Date(iso);
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt).replace(" um ", ", ");
}

/**
 * Parse YYYY-MM date string
 */
export function parseYearMonth(yearMonth: string): { year: number; month: number } | null {
  const match = yearMonth.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-indexed
  
  if (month < 0 || month > 11) return null;
  
  return { year, month };
}

/**
 * Parse YYYY-MM-DD date string
 */
export function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-indexed
  const day = parseInt(match[3], 10);
  
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  
  return { year, month, day };
}

/**
 * Calculate hours from time range
 * 
 * Accepts time formats:
 * - "HH:MM" (e.g., "08:00")
 * - "HH:MM:SS" (e.g., "08:00:00") - seconds are ignored
 * 
 * @param from - Start time (HH:MM or HH:MM:SS)
 * @param to - End time (HH:MM or HH:MM:SS)
 * @param pause - Pause in minutes (must be a number >= 0)
 * @returns Hours as decimal, or null if invalid (invalid format, to <= from, or pause > duration)
 */
export function calculateHours(from: string, to: string, pause: number): number | null {
  // Normalize inputs: trim and handle HH:MM:SS format
  const normalizedFrom = from.trim();
  const normalizedTo = to.trim();
  
  // Extract HH:MM from HH:MM:SS if present (take first 5 chars)
  const fromTime = normalizedFrom.length >= 5 ? normalizedFrom.substring(0, 5) : normalizedFrom;
  const toTime = normalizedTo.length >= 5 ? normalizedTo.substring(0, 5) : normalizedTo;
  
  // Match HH:MM format (1-2 digits, colon, 2 digits)
  const fromMatch = fromTime.match(/^(\d{1,2}):(\d{2})$/);
  const toMatch = toTime.match(/^(\d{1,2}):(\d{2})$/);
  
  if (!fromMatch || !toMatch) return null;
  
  // Ensure pause is a valid number
  const pauseMinutes = Number(pause);
  if (isNaN(pauseMinutes) || pauseMinutes < 0) return null;
  
  const fromHours = parseInt(fromMatch[1], 10);
  const fromMinutes = parseInt(fromMatch[2], 10);
  const toHours = parseInt(toMatch[1], 10);
  const toMinutes = parseInt(toMatch[2], 10);
  
  // Validate time ranges
  if (fromHours < 0 || fromHours > 23 || fromMinutes < 0 || fromMinutes > 59) return null;
  if (toHours < 0 || toHours > 23 || toMinutes < 0 || toMinutes > 59) return null;
  
  const fromTotal = fromHours * 60 + fromMinutes;
  const toTotal = toHours * 60 + toMinutes;
  
  // End must be after start
  if (toTotal <= fromTotal) return null;
  
  const workMinutes = toTotal - fromTotal - pauseMinutes;
  
  // Pause cannot exceed work duration
  if (workMinutes < 0) return null;
  
  return workMinutes / 60;
}

/**
 * Format hours as decimal string with 2 decimals
 */
export function formatHours(hours: number): string {
  return hours.toFixed(2).replace(".", ",");
}

/**
 * Get calendar grid for a month
 * Returns array of weeks, each week has 7 days (some may be null for padding)
 */
export function getCalendarGrid(year: number, month: number): (number | null)[][] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Adjust for Monday start (German calendar)
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  
  const grid: (number | null)[][] = [];
  let week: (number | null)[] = [];
  
  // Add padding at start
  for (let i = 0; i < offset; i++) {
    week.push(null);
  }
  
  // Add days
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  
  // Add padding at end
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    grid.push(week);
  }
  
  return grid;
}

