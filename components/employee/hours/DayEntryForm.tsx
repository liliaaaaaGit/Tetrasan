"use client";

import React, { useState } from "react";
import { DayEntry, DayStatus } from "./types";
import { calculateHours, formatHours } from "@/lib/date-utils";
import { Info } from "lucide-react";

interface DayEntryFormProps {
  initialData?: DayEntry;
  date: string; // YYYY-MM-DD
  onSave: (entry: DayEntry) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isAdmin?: boolean; // If true, hide save/cancel buttons and make form read-only
}

/**
 * DayEntryForm Component
 * Form for entering/editing a single day's time entry
 * Handles validation and conditional required fields based on status
 */
export function DayEntryForm({ initialData, date, onSave, onCancel, isLoading = false, isAdmin = false }: DayEntryFormProps) {
  const [status, setStatus] = useState<DayStatus>(initialData?.status || "arbeit");
  const [from, setFrom] = useState(initialData?.from || "08:00");
  const [to, setTo] = useState(initialData?.to || "");
  const [pause, setPause] = useState(initialData?.pause ?? 30);
  const [bauvorhaben, setBauvorhaben] = useState(initialData?.bauvorhaben ?? "");
  const [taetigkeit, setTaetigkeit] = useState(initialData?.taetigkeit ?? "");
  const [kommentar, setKommentar] = useState(initialData?.kommentar ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Normalize time strings (handle HH:MM:SS format from HTML time inputs)
  const normalizeTime = (time: string): string => {
    if (!time) return '';
    // If time has seconds (HH:MM:SS), remove them
    return time.length >= 5 ? time.substring(0, 5) : time;
  };

  const normalizedFrom = normalizeTime(from);
  const normalizedTo = normalizeTime(to);
  const hasEndTime = Boolean(normalizedTo);
  const trimmedBauvorhaben = bauvorhaben.trim();
  const trimmedTaetigkeit = taetigkeit.trim();

  // Normalize pause to ensure it's a number
  const pauseMinutes = Number(pause) || 0;

  // Calculate hours preview - use calculateHours as single source of truth
  const calculatedHours =
    status === "arbeit" && hasEndTime
      ? calculateHours(normalizedFrom, normalizedTo, pauseMinutes)
      : null;

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (status === "arbeit") {
      if (!normalizedFrom) {
        newErrors.from = "Please enter a start time.";
      }

      if (pauseMinutes < 0) newErrors.pause = "Pause darf nicht negativ sein";

      if (hasEndTime) {
        if (!trimmedBauvorhaben) {
          newErrors.bauvorhaben = "Please enter a project name.";
        }
        if (!trimmedTaetigkeit) {
          newErrors.taetigkeit = "Please enter a work report.";
        }

        if (normalizedFrom) {
          const hours = calculateHours(normalizedFrom, normalizedTo, pauseMinutes);
          if (hours === null) {
            newErrors.to = "End time must be after start time.";
          }
        }
      }
    } else {
      // Vacation or sick day
      if (!kommentar.trim()) {
        newErrors.kommentar = "Kommentar ist erforderlich";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    // For work entries, calculatedHours must be a valid number (not null)
    if (status === "arbeit" && hasEndTime && calculatedHours === null) {
      setErrors((prev) => ({ ...prev, to: "End time must be after start time." }));
      return;
    }

    const entry: DayEntry = {
      date,
      status,
      ...(status === "arbeit" && {
        from: normalizedFrom,
        pause: pauseMinutes,
        bauvorhaben: trimmedBauvorhaben,
        taetigkeit: trimmedTaetigkeit,
        ...(hasEndTime && {
          to: normalizedTo,
          hours: calculatedHours ?? undefined,
        }),
      }),
      ...(status !== "arbeit" && {
        kommentar,
      }),
    };

    onSave(entry);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Status</label>
        <div className="grid grid-cols-3 gap-2">
          {(["arbeit", "urlaub", "krank"] as DayStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setErrors({});
              }}
              disabled={isAdmin}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === s
                  ? "bg-brand text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              } ${isAdmin ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {s === "arbeit" ? "Arbeit" : s === "urlaub" ? "Urlaub" : "Krank"}
            </button>
          ))}
        </div>
      </div>

      {/* Work fields */}
      {status === "arbeit" && (
        <>
          {/* Project name */}
          <div>
            <label htmlFor="bauvorhaben" className="block text-sm font-medium mb-1">
              Bauvorhaben
              {hasEndTime && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              id="bauvorhaben"
              value={bauvorhaben}
              onChange={(e) => {
                setBauvorhaben(e.target.value);
                setErrors((prev) => ({ ...prev, bauvorhaben: "" }));
              }}
              disabled={isAdmin}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                errors.bauvorhaben ? "border-red-500" : "border-border"
              } ${isAdmin ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              placeholder="Z. B. Neubau Musterstraße 12"
            />
            {errors.bauvorhaben && (
              <p className="text-xs text-red-600 mt-1">{errors.bauvorhaben}</p>
            )}
          </div>

          {/* Time fields (compact) */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 sm:max-w-[150px]">
              <label htmlFor="from" className="block text-sm font-medium mb-1">
                Von
              </label>
              <input
                id="from"
                type="time"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setErrors((prev) => ({ ...prev, from: "", to: "" }));
                }}
                disabled={isAdmin}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.from ? "border-red-500" : "border-border"
                } ${isAdmin ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.from && (
                <p className="text-xs text-red-600 mt-1">{errors.from}</p>
              )}
            </div>

            <div className="flex-1 sm:max-w-[150px]">
              <label htmlFor="to" className="block text-sm font-medium mb-1">
                Bis
              </label>
              <input
                id="to"
                type="time"
                value={to}
                onChange={(e) => {
                  const value = e.target.value;
                  setTo(value);
                  setErrors((prev) =>
                    !value
                      ? { ...prev, to: "", bauvorhaben: "", taetigkeit: "" }
                      : { ...prev, to: "" }
                  );
                }}
                disabled={isAdmin}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.to ? "border-red-500" : "border-border"
                } ${isAdmin ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.to && (
                <p className="text-xs text-red-600 mt-1">{errors.to}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You can save your start time first. Project and report are only required when you log your end time.
          </p>

          {/* Pause */}
          <div>
            <label htmlFor="pause" className="block text-sm font-medium mb-1">
              Pause (Minuten)
            </label>
              <input
                id="pause"
                type="number"
                min="0"
                value={pause}
                onChange={(e) => {
                  setPause(parseInt(e.target.value, 10) || 0);
                  setErrors((prev) => ({ ...prev, pause: "" }));
                }}
                disabled={isAdmin}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.pause ? "border-red-500" : "border-border"
                } ${isAdmin ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
            {errors.pause && (
              <p className="text-xs text-red-600 mt-1">{errors.pause}</p>
            )}
          </div>

          {/* Hours Preview */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Stunden (berechnet):{" "}
                  {calculatedHours !== null ? formatHours(calculatedHours) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Report */}
          <div>
            <label htmlFor="taetigkeit" className="block text-sm font-medium mb-1">
              Tätigkeitsbericht
              {hasEndTime && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              id="taetigkeit"
              value={taetigkeit}
              onChange={(e) => {
                setTaetigkeit(e.target.value);
                setErrors((prev) => ({ ...prev, taetigkeit: "" }));
              }}
              disabled={isAdmin}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                errors.taetigkeit ? "border-red-500" : "border-border"
              } ${isAdmin ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              placeholder="Was hast du heute gemacht?"
            />
            {errors.taetigkeit && (
              <p className="text-xs text-red-600 mt-1">{errors.taetigkeit}</p>
            )}
          </div>
        </>
      )}

      {/* Vacation/Sick comment */}
      {status !== "arbeit" && (
        <div>
          <label htmlFor="kommentar" className="block text-sm font-medium mb-1">
            Kommentar *
          </label>
          <textarea
            id="kommentar"
            value={kommentar}
            onChange={(e) => {
              setKommentar(e.target.value);
              setErrors((prev) => ({ ...prev, kommentar: "" }));
            }}
            disabled={isAdmin}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
              errors.kommentar ? "border-red-500" : "border-border"
            } ${isAdmin ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
            placeholder={
              status === "urlaub"
                ? "Urlaubsgrund (optional)"
                : "Grund für Krankheit (optional)"
            }
          />
          {errors.kommentar && (
            <p className="text-xs text-red-600 mt-1">{errors.kommentar}</p>
          )}
        </div>
      )}

      {/* Buttons - Hidden for admin view */}
      {!isAdmin && (
        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-secondary/80"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Speichern..." : "Speichern"}
          </button>
        </div>
      )}
    </form>
  );
}

