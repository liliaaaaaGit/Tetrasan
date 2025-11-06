/**
 * Deep-link utilities for handling query parameters and hash anchors
 * Examples:
 * - ?focus=leave → activates the "Urlaub" tab
 * - #req-123 → scrolls to the element with id="req-123"
 */

export type TabValue = "hours" | "dayoff" | "leave";

/**
 * Parse the focus query parameter to determine which tab to activate
 * @param searchParams - URL search parameters
 * @returns The tab value to focus on, or null
 */
export function parseFocusQuery(searchParams: URLSearchParams): TabValue | null {
  const focus = searchParams.get("focus");
  
  if (focus === "leave" || focus === "urlaub") return "leave";
  if (focus === "dayoff" || focus === "tagesbefreiung") return "dayoff";
  if (focus === "hours" || focus === "stunden") return "hours";
  
  return null;
}

/**
 * Scroll to an element by hash anchor
 * @param hash - The hash from window.location.hash (e.g., "#req-123")
 */
export function scrollToHash(hash: string) {
  if (!hash) return;
  
  // Remove the # symbol
  const id = hash.replace("#", "");
  
  // Wait for the DOM to render, then scroll
  setTimeout(() => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add a highlight effect
      element.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  }, 300);
}

/**
 * Get the initial active tab based on URL parameters
 * @param searchParams - URL search parameters
 * @param hash - URL hash
 * @param defaultTab - Fallback tab if no focus is specified
 * @returns The tab value to activate
 */
export function getInitialTab(
  searchParams: URLSearchParams,
  hash: string,
  defaultTab: TabValue = "hours"
): TabValue {
  // Priority 1: focus query parameter
  const focusTab = parseFocusQuery(searchParams);
  if (focusTab) return focusTab;
  
  // Priority 2: infer from hash (e.g., #req-201 likely belongs to leave/dayoff)
  if (hash) {
    const id = hash.replace("#", "");
    if (id.startsWith("req-2")) return "leave";
    if (id.startsWith("req-1")) return "dayoff";
    if (id.startsWith("h-")) return "hours";
  }
  
  // Fallback
  return defaultTab;
}

