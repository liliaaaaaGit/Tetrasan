import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * This helps avoid conflicts when combining multiple class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

