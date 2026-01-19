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
 * Check if a date (YYYY-MM-DD string or Date object) is a Sunday
 * Sunday = day of week 0 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function isSunday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : date;
  // Use UTC to avoid timezone issues
  return d.getUTCDay() === 0;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : date;
  const day = d.getUTCDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is a weekday (Monday-Friday)
 */
export function isWeekday(date: string | Date): boolean {
  return !isWeekend(date);
}

/**
 * Get day of week for a date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeek(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : date;
  return d.getUTCDay();
}

/**
 * Check if a date is a holiday
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @param holidays - Set of holiday date strings (YYYY-MM-DD) or Map/Record of holidays
 */
export function isHoliday(
  date: string | Date,
  holidays: Set<string> | Record<string, any> | Map<string, any>
): boolean {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  if (holidays instanceof Set) {
    return holidays.has(dateStr);
  } else if (holidays instanceof Map) {
    return holidays.has(dateStr);
  } else if (typeof holidays === 'object' && holidays !== null) {
    return dateStr in holidays;
  }
  
  return false;
}

/**
 * Check if a date is a weekday holiday (holiday on Mon-Fri)
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @param holidays - Set/Map/Record of holiday dates
 * @returns true if the date is a holiday on a weekday (Mon-Fri)
 */
export function isWeekdayHoliday(
  date: string | Date,
  holidays: Set<string> | Record<string, any> | Map<string, any>
): boolean {
  if (!isHoliday(date, holidays)) {
    return false;
  }
  
  const dayOfWeek = getDayOfWeek(date);
  // Monday (1) through Friday (5) are weekdays
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Check if a date is a blocked day (Sunday or any holiday)
 * Blocked days cannot have any entries created (Arbeit, Urlaub, Krank, Tagesbefreiung)
 * All holidays are blocked, regardless of the day of week (including Saturday holidays)
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @param holidays - Set/Map/Record of holiday dates
 * @returns true if the date is blocked (Sunday or any holiday)
 */
export function isBlockedDay(
  date: string | Date,
  holidays: Set<string> | Record<string, any> | Map<string, any>
): boolean {
  // Sunday is always blocked
  if (isSunday(date)) {
    return true;
  }
  
  // All holidays are blocked (including Saturday holidays)
  return isHoliday(date, holidays);
}

/**
 * Calculate paid hours for a holiday based on business rules:
 * - Mon-Fri holiday: 8h paid
 * - Saturday holiday: 0h paid
 * - Sunday: 0h (and blocked anyway, but included for completeness)
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @param holidays - Set/Map/Record of holiday dates
 * @returns Paid hours (0 or 8), or 0 if not a holiday
 */
export function holidayPaidHours(
  date: string | Date,
  holidays: Set<string> | Record<string, any> | Map<string, any>
): number {
  if (!isHoliday(date, holidays)) {
    return 0;
  }
  
  const dayOfWeek = getDayOfWeek(date);
  
  // Sunday: 0h (blocked anyway)
  if (dayOfWeek === 0) {
    return 0;
  }
  
  // Saturday: 0h
  if (dayOfWeek === 6) {
    return 0;
  }
  
  // Monday-Friday: 8h
  return 8;
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

