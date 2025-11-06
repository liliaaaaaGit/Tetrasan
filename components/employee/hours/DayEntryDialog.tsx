"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Calendar, Edit } from "lucide-react";
import { DayEntry } from "./types";
import { DayEntryForm } from "./DayEntryForm";
import { formatDateDE } from "@/lib/date-utils";

interface Correction {
  id?: string;
  corrected_time_from?: string;
  corrected_time_to?: string;
  corrected_break_minutes?: number;
  corrected_hours_decimal?: number;
  note?: string;
  created_at?: string;
  admin?: {
    full_name?: string;
    email?: string;
  };
}

interface DayEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string; // YYYY-MM-DD
  initialData?: DayEntry;
  correction?: Correction;
  isAdmin?: boolean;
  onSave: (entry: DayEntry) => void;
  onDelete?: () => void;
  onCorrectionClick?: () => void;
  isLoading?: boolean;
}

/**
 * DayEntryDialog Component
 * Modal dialog for creating/editing day entries
 * Includes delete functionality for existing entries
 */
export function DayEntryDialog({
  open,
  onOpenChange,
  date,
  initialData,
  correction,
  isAdmin = false,
  onSave,
  onDelete,
  onCorrectionClick,
  isLoading = false,
}: DayEntryDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Debug logging for admin context
  useEffect(() => {
    if (open && isAdmin) {
      console.log('[DayEntryDialog] Admin mode active', { 
        isAdmin, 
        hasInitialData: !!initialData,
        entryStatus: initialData?.status,
        entryId: initialData?.id,
        hasCorrection: !!correction
      });
    }
  }, [open, isAdmin, initialData, correction]);

  if (!open) return null;

  const handleSave = (entry: DayEntry) => {
    onSave(entry);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete();
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  // Parse date for display
  const dateParts = date.split("-");
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);
  const formattedDate = formatDateDE(year, month, day);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">
                  {initialData ? "Eintrag bearbeiten" : "Eintrag erstellen"}
                </h2>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <DayEntryForm
            initialData={initialData}
            date={date}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />

          {/* Correction Display (Admin only) */}
          {isAdmin && initialData && correction && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-red-800">
                  Korrektur (Admin)
                </span>
                {correction.admin?.full_name && (
                  <span className="text-xs text-red-600">
                    von {correction.admin.full_name}
                  </span>
                )}
                {correction.created_at && (
                  <span className="text-xs text-red-600">
                    {new Date(correction.created_at).toLocaleString('de-DE')}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-red-900 space-y-1">
                {correction.corrected_time_from && correction.corrected_time_to && (
                  <>
                    <div>
                      <span className="font-medium">Von:</span> {correction.corrected_time_from}
                    </div>
                    <div>
                      <span className="font-medium">Bis:</span> {correction.corrected_time_to}
                    </div>
                    <div>
                      <span className="font-medium">Pause:</span> {correction.corrected_break_minutes || 0} min
                    </div>
                    {correction.corrected_hours_decimal !== undefined && (
                      <div>
                        <span className="font-medium">Stunden:</span> {correction.corrected_hours_decimal.toFixed(2)}
                      </div>
                    )}
                  </>
                )}
                {correction.note && (
                  <div className="mt-2">
                    <span className="font-medium">Grund:</span> {correction.note}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Correction Button (Admin only, for work entries) */}
          {isAdmin && initialData && initialData.status === "arbeit" && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  console.log('[DayEntryDialog] Correction button clicked', { 
                    isAdmin, 
                    hasInitialData: !!initialData,
                    status: initialData?.status,
                    entryId: initialData?.id 
                  });
                  if (onCorrectionClick && initialData?.id) {
                    onCorrectionClick();
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors w-full justify-center border border-red-200"
              >
                <Edit className="h-4 w-4" />
                <span>{correction ? "Korrektur bearbeiten" : "Korrektur hinzufügen"}</span>
              </button>
            </div>
          )}

          {/* Delete button for existing entries */}
          {initialData && onDelete && !showDeleteConfirm && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full justify-center"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eintrag löschen</span>
              </button>
            </div>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-3">
                Eintrag löschen?
              </p>
              <p className="text-sm text-red-700 mb-4">
                Bist du sicher? Dieser Vorgang kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-red-200 rounded-md hover:bg-red-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Löschen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

