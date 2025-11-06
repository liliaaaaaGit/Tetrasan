"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parseYearMonth } from "@/lib/date-utils";

/**
 * Hook to manage current month state with URL sync
 * Supports ?month=YYYY-MM query parameter
 * @param basePath - Base path for URL navigation (default: '/employee/hours')
 */
export function useMonthState(basePath: string = '/employee/hours') {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize with current month or from URL
  const [year, setYear] = useState<number>(() => {
    const monthParam = searchParams.get("month");
    if (monthParam) {
      const parsed = parseYearMonth(monthParam);
      if (parsed) return parsed.year;
    }
    return new Date().getFullYear();
  });
  
  const [month, setMonth] = useState<number>(() => {
    const monthParam = searchParams.get("month");
    if (monthParam) {
      const parsed = parseYearMonth(monthParam);
      if (parsed) return parsed.month;
    }
    return new Date().getMonth();
  });
  
  // Sync URL when month changes (only if basePath is provided)
  useEffect(() => {
    // Only update URL if basePath is provided and not empty (employee context)
    // For admin context (empty basePath), don't change the URL to avoid navigation
    if (basePath && basePath.length > 0) {
      const monthStr = String(month + 1).padStart(2, "0");
      const newUrl = `${basePath}?month=${year}-${monthStr}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [year, month, router, basePath]);
  
  const goToPreviousMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };
  
  return {
    year,
    month,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  };
}

