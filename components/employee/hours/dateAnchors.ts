/**
 * Utilities for handling date hash anchors (#YYYY-MM-DD)
 * Highlights and scrolls to a specific day in the calendar
 */

import { parseDate } from "@/lib/date-utils";

/**
 * Scroll to a date and highlight it
 * @param hash - URL hash (e.g., "#2024-10-14")
 */
export function scrollToDateHash(hash: string) {
  if (!hash || !hash.startsWith("#")) return;
  
  const dateStr = hash.substring(1);
  const parsed = parseDate(dateStr);
  
  if (!parsed) return;
  
  // Wait for DOM to render
  setTimeout(() => {
    const element = document.getElementById(`day-${dateStr}`);
    if (element) {
      // Scroll into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Add pulse/highlight effect
      element.classList.add("animate-pulse", "ring-2", "ring-primary", "ring-offset-2");
      
      // Remove after 2 seconds
      setTimeout(() => {
        element.classList.remove("animate-pulse", "ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  }, 300);
}

/**
 * Check if hash matches current month
 */
export function isHashInMonth(hash: string, year: number, month: number): boolean {
  if (!hash || !hash.startsWith("#")) return false;
  
  const dateStr = hash.substring(1);
  const parsed = parseDate(dateStr);
  
  if (!parsed) return false;
  
  return parsed.year === year && parsed.month === month;
}

