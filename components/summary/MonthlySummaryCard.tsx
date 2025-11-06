/**
 * Monthly Summary Card Component
 * Displays monthly summary with total hours and breakdown by category
 */

import { SummaryOutput, formatMinutesDe } from '@/lib/logic/monthlySummary';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlySummaryCardProps {
  summary: SummaryOutput | null;
  isLoading?: boolean;
}

export function MonthlySummaryCard({
  summary,
  isLoading = false,
}: MonthlySummaryCardProps) {
  if (isLoading) {
    return (
      <div className="mb-6 bg-white border border-brand-muted/40 rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
          <span className="ml-2 text-sm text-brand-muted">
            Lade Monatszusammenfassung...
          </span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const { totalMinutes, workMinutes, sickMinutes, vacationMinutes, holidayMinutes } =
    summary;

  const categories = [
    {
      label: 'Arbeit',
      minutes: workMinutes,
      borderColor: 'border-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-900',
    },
    {
      label: 'Krank',
      minutes: sickMinutes,
      borderColor: 'border-red-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-900',
    },
    {
      label: 'Urlaub',
      minutes: vacationMinutes,
      borderColor: 'border-vacation-border',
      bgColor: 'bg-vacation-fill',
      textColor: 'text-brand',
    },
    {
      label: 'Feiertag',
      minutes: holidayMinutes,
      borderColor: 'border-brand',
      bgColor: 'bg-brand/10',
      textColor: 'text-brand',
    },
  ];

  return (
    <div className="mb-6 bg-white border border-brand-muted/40 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Monatszusammenfassung
        </h3>

        {/* Total Hours */}
        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-bold text-brand">
              {formatMinutesDe(totalMinutes)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              Gesamtstunden
            </span>
          </div>
        </div>
      </div>

      {/* Category Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.map((category) => (
          <div
            key={category.label}
            className={cn(
              'rounded-lg border-2 p-3 md:p-4',
              category.borderColor,
              category.bgColor
            )}
          >
            <div className="text-xs md:text-sm font-medium text-muted-foreground mb-1">
              {category.label}
            </div>
            <div className={cn('text-lg md:text-xl font-semibold', category.textColor)}>
              {formatMinutesDe(category.minutes)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

