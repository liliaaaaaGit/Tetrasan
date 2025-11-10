import { useTranslations } from "next-intl";
import { SummaryOutput } from "@/lib/logic/monthlySummary";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlySummaryCardProps {
  summary: SummaryOutput | null;
  isLoading?: boolean;
}

export function MonthlySummaryCard({
  summary,
  isLoading = false,
}: MonthlySummaryCardProps) {
  const tSummary = useTranslations("hoursPage.summary");
  const tLegend = useTranslations("hoursPage.legend");

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return tSummary("hoursAndMinutes", { hours, minutes: mins });
    }

    if (hours > 0) {
      return tSummary("hoursOnly", { hours });
    }

    return tSummary("minutesOnly", { minutes: mins });
  };

  if (isLoading) {
    return (
      <div className="mb-6 bg-white border border-brand-muted/40 rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
          <span className="ml-2 text-sm text-brand-muted">
            {tSummary("loading")}
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
      label: tLegend("work"),
      minutes: workMinutes,
      borderColor: "border-green-500",
      bgColor: "bg-green-100",
      textColor: "text-green-900",
    },
    {
      label: tLegend("sick"),
      minutes: sickMinutes,
      borderColor: "border-red-500",
      bgColor: "bg-red-100",
      textColor: "text-red-900",
    },
    {
      label: tLegend("vacation"),
      minutes: vacationMinutes,
      borderColor: "border-vacation-border",
      bgColor: "bg-vacation-fill",
      textColor: "text-brand",
    },
    {
      label: tLegend("holiday"),
      minutes: holidayMinutes,
      borderColor: "border-brand",
      bgColor: "bg-brand/10",
      textColor: "text-brand",
    },
  ];

  return (
    <div className="mb-6 bg-white border border-brand-muted/40 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {tSummary("title")}
        </h3>

        {/* Total Hours */}
        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-bold text-brand">
              {formatDuration(totalMinutes)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {tSummary("totalHours")}
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
              "rounded-lg border-2 p-3 md:p-4",
              category.borderColor,
              category.bgColor
            )}
          >
            <div className="text-xs md:text-sm font-medium text-muted-foreground mb-1">
              {category.label}
            </div>
            <div className={cn("text-lg md:text-xl font-semibold", category.textColor)}>
              {formatDuration(category.minutes)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

