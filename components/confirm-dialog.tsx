"use client";

import React from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog Component
 * A modal dialog for confirming destructive actions (like deleting data)
 * Currently just UI - no real deletion logic yet
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog content */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                onCancel();
                onOpenChange(false);
              }}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-secondary/80"
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-md hover:bg-destructive/80"
            >
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

