import React from "react";
import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

/**
 * EmptyState Component
 * Shows a friendly message when there's no data to display
 * Example: "Keine Einträge vorhanden" (No entries available)
 */
export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-muted-foreground mb-3">
        {icon || <FileQuestion className="h-12 w-12" />}
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

