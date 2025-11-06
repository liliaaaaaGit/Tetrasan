"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { DayEntry } from "@/components/employee/hours/types";
import { calculateHours, formatHours } from "@/lib/date-utils";

interface Correction {
  id?: string;
  corrected_time_from?: string;
  corrected_time_to?: string;
  corrected_break_minutes?: number;
  corrected_hours_decimal?: number;
  note?: string;
}

interface AdminCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  originalEntry: DayEntry;
  existingCorrection?: Correction;
  onSave: (correction: any) => void;
  isLoading?: boolean;
}

/**
 * AdminCorrectionDialog Component
 * Allows admins to correct employee time entries
 * Shows original entry and allows editing corrected values
 */
export function AdminCorrectionDialog({
  open,
  onOpenChange,
  entryId,
  originalEntry,
  existingCorrection,
  onSave,
  isLoading = false,
}: AdminCorrectionDialogProps) {
  // Initialize state with proper fallbacks - ensure we always have valid time values
  const [from, setFrom] = useState(() => {
    return existingCorrection?.corrected_time_from || originalEntry.from || "08:00";
  });
  const [to, setTo] = useState(() => {
    return existingCorrection?.corrected_time_to || originalEntry.to || "17:00";
  });
  const [pause, setPause] = useState(existingCorrection?.corrected_break_minutes ?? originalEntry.pause ?? 0);
  const [note, setNote] = useState(existingCorrection?.note || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasTouched, setHasTouched] = useState(false);

  // Reset state when dialog opens with new data
  useEffect(() => {
    if (open) {
      setFrom(existingCorrection?.corrected_time_from || originalEntry.from || "08:00");
      setTo(existingCorrection?.corrected_time_to || originalEntry.to || "17:00");
      setPause(existingCorrection?.corrected_break_minutes ?? originalEntry.pause ?? 0);
      setNote(existingCorrection?.note || "");
      setErrors({});
      setHasTouched(false);
    }
  }, [open, existingCorrection, originalEntry.from, originalEntry.to, originalEntry.pause]);

  if (!open) return null;

  // Normalize time strings (remove seconds if present: "08:00:00" -> "08:00")
  const normalizeTime = (time: string): string => {
    if (!time) return '';
    // If time has seconds (HH:MM:SS), remove them
    return time.length >= 5 ? time.substring(0, 5) : time;
  };

  // Normalize pause to ensure it's a number
  const pauseMinutes = Number(pause) || 0;

  // Calculate corrected hours - use calculateHours as single source of truth
  const calculatedHours = from && to ? calculateHours(normalizeTime(from), normalizeTime(to), pauseMinutes) : null;

  // Handle input changes with validation clearing
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(e.target.value);
    setHasTouched(true);
    // Clear errors when user starts typing
    setErrors((prev) => ({ ...prev, from: "", to: "" }));
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
    setHasTouched(true);
    // Clear errors when user starts typing
    setErrors((prev) => ({ ...prev, to: "" }));
  };

  const handleToBlur = () => {
    // Validate time order only when user finishes editing
    if (from && to && calculateHours(normalizeTime(from), normalizeTime(to), pauseMinutes) === null) {
      setErrors((prev) => ({ ...prev, to: "Ende muss nach Beginn liegen oder Zeitangaben sind ungültig" }));
    }
  };

  const handlePauseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPause = parseInt(e.target.value, 10) || 0;
    setPause(newPause);
    setHasTouched(true);
    // Clear errors when user starts typing
    setErrors((prev) => ({ ...prev, pause: "" }));
  };

  const handlePauseBlur = () => {
    // Validate pause doesn't exceed work time only when user finishes editing
    if (from && to) {
      const hours = calculateHours(normalizeTime(from), normalizeTime(to), pauseMinutes);
      if (hours === null) {
        setErrors((prev) => ({ ...prev, pause: "Pause ist zu lang oder Zeitangaben sind ungültig" }));
      }
    }
  };

  // Validate form - returns errors object
  const validate = (): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (!from || from.trim() === '') {
      newErrors.from = "Von ist erforderlich";
    }
    if (!to || to.trim() === '') {
      newErrors.to = "Bis ist erforderlich";
    }
    if (pauseMinutes < 0) {
      newErrors.pause = "Pause darf nicht negativ sein";
    }
    
    // Use calculateHours as single source of truth for time validation
    if (from && to && from.trim() !== '' && to.trim() !== '') {
      const hours = calculateHours(normalizeTime(from), normalizeTime(to), pauseMinutes);
      if (hours === null) {
        // calculateHours returns null for: invalid format, to <= from, or pause > duration
        newErrors.to = "Ende muss nach Beginn liegen oder Zeitangaben sind ungültig";
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return { isValid, errors: newErrors };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[AdminCorrectionDialog] Form submitted', {
      from,
      to,
      pause,
      pauseMinutes,
      calculatedHours,
      entryId,
      normalizedFrom: normalizeTime(from),
      normalizedTo: normalizeTime(to)
    });
    
    // Validate (this sets errors state)
    const validationResult = validate();
    if (!validationResult.isValid) {
      console.log('[AdminCorrectionDialog] Validation failed', validationResult.errors);
      return;
    }

    // calculatedHours must be a valid number (not null) after validation
    if (calculatedHours === null) {
      setErrors((prev) => ({ ...prev, to: "Ungültige Zeitangaben" }));
      return;
    }

    const correction = {
      entry_id: entryId,
      corrected_time_from: normalizeTime(from),
      corrected_time_to: normalizeTime(to),
      corrected_break_minutes: pauseMinutes,
      corrected_hours_decimal: calculatedHours, // Store actual calculated hours, not default to 0
      note: note.trim() || undefined,
    };

    console.log('[AdminCorrectionDialog] Calling onSave with:', correction);
    onSave(correction);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

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
            <div>
              <h2 className="text-lg font-semibold text-red-600">
                Korrektur (Admin)
              </h2>
              <p className="text-sm text-muted-foreground">Korrektur für Eintrag vom {new Date(originalEntry.date).toLocaleDateString('de-DE')}</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Original Entry Display */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Originaleintrag:</h3>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Von:</span> {originalEntry.from}
              </div>
              <div>
                <span className="font-medium">Bis:</span> {originalEntry.to}
              </div>
              <div>
                <span className="font-medium">Pause:</span> {originalEntry.pause || 0} min
              </div>
              <div>
                <span className="font-medium">Stunden:</span> {formatHours(originalEntry.hours || 0)}
              </div>
              {originalEntry.note && (
                <div>
                  <span className="font-medium">Notiz:</span> {originalEntry.note}
                </div>
              )}
            </div>
          </div>

          {/* Correction Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Time fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="from" className="block text-sm font-medium mb-1 text-red-700">
                  Korrigiert von
                </label>
                <input
                  id="from"
                  type="time"
                  value={from}
                  onChange={handleFromChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.from ? "border-red-500" : "border-red-300"
                  }`}
                />
                {errors.from && (
                  <p className="text-xs text-red-600 mt-1">{errors.from}</p>
                )}
              </div>

              <div>
                <label htmlFor="to" className="block text-sm font-medium mb-1 text-red-700">
                  Korrigiert bis
                </label>
                <input
                  id="to"
                  type="time"
                  value={to}
                  onChange={handleToChange}
                  onBlur={handleToBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.to ? "border-red-500" : "border-red-300"
                  }`}
                />
                {errors.to && (
                  <p className="text-xs text-red-600 mt-1">{errors.to}</p>
                )}
              </div>
            </div>

            {/* Pause */}
            <div>
              <label htmlFor="pause" className="block text-sm font-medium mb-1 text-red-700">
                Korrigierte Pause (Minuten)
              </label>
              <input
                id="pause"
                type="number"
                min="0"
                value={pause}
                onChange={handlePauseChange}
                onBlur={handlePauseBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.pause ? "border-red-500" : "border-red-300"
                }`}
              />
              {errors.pause && (
                <p className="text-xs text-red-600 mt-1">{errors.pause}</p>
              )}
            </div>

            {/* Corrected Hours Preview */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">
                Korrigierte Stunden:{" "}
                {calculatedHours !== null ? formatHours(calculatedHours) : "—"}
              </p>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium mb-1 text-red-700">
                Korrektur-Grund (optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="Grund für die Korrektur..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-secondary/80"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isLoading || !from || !to}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Speichern..." : "Korrektur speichern"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

