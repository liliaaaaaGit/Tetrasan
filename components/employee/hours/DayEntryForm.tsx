"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { DayEntry, DayStatus } from "./types";
import { calculateHours, formatHours, isSunday } from "@/lib/date-utils";
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
  // Allow admins to create new entries (when initialData is undefined), but keep read-only for viewing existing entries
  const isReadOnly = isAdmin && !!initialData;
  const [status, setStatus] = useState<DayStatus>(initialData?.status || "arbeit");
  // Default "from" time:
  // - Use existing value if present
  // - For new work entries, default to 08:00
  // - For other statuses (e.g. Tagesbefreiung), start empty so we don't show 08:00 for full-day entries
  const [from, setFrom] = useState(
    initialData?.from || (initialData?.status === "arbeit" || !initialData ? "08:00" : "")
  );
  const [to, setTo] = useState(initialData?.to || "");
  const [pause, setPause] = useState(initialData?.pause ?? 30);
  const [bauvorhaben, setBauvorhaben] = useState(initialData?.bauvorhaben ?? "");
  const [taetigkeit, setTaetigkeit] = useState(initialData?.taetigkeit ?? "");
  const [kommentar, setKommentar] = useState(initialData?.kommentar ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = useTranslations("dayEntryForm");
  // Vacation (Urlaub) date range – default to the clicked day when opening the modal
  const [vacationStartDate, setVacationStartDate] = useState<string>(
    (initialData?.rangeStart as string | undefined) || initialData?.date || date
  );
  const [vacationEndDate, setVacationEndDate] = useState<string>(
    (initialData?.rangeEnd as string | undefined) || initialData?.date || date
  );

  // Normalize time strings (handle HH:MM:SS format from HTML time inputs)
  const normalizeTime = (time: string): string => {
    if (!time) return "";
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
    (status === "arbeit" || status === "tagesbefreiung") && hasEndTime
      ? calculateHours(
          normalizedFrom,
          normalizedTo,
          status === "arbeit" ? pauseMinutes : 0
        )
      : null;

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Block entries on Sundays - Sundays are always free
    if (isSunday(date)) {
      newErrors.date = "Sonntage sind immer frei; Einträge sind nicht erlaubt.";
      setErrors(newErrors);
      return false;
    }

    if (status === "arbeit") {
      if (!normalizedFrom) {
        newErrors.from = t("errors.fromRequired");
      }

      if (pauseMinutes < 0) newErrors.pause = t("errors.pauseNegative");

      if (hasEndTime) {
        if (!trimmedBauvorhaben) {
          newErrors.bauvorhaben = t("errors.projectMissing");
        }
        if (!trimmedTaetigkeit) {
          newErrors.taetigkeit = t("errors.workReportMissing");
        }

        if (normalizedFrom) {
          const hours = calculateHours(normalizedFrom, normalizedTo, pauseMinutes);
          if (hours === null) {
            newErrors.to = t("errors.endAfterStart");
          }
        }
      }
    } else if (status === "urlaub") {
      // Vacation: validate date range (Von/Bis)
      if (!vacationStartDate) {
        newErrors.vacationStartDate = t("errors.startDateRequired");
      }
      if (!vacationEndDate) {
        newErrors.vacationEndDate = t("errors.endDateRequired");
      }
      if (vacationStartDate && vacationEndDate) {
        const start = new Date(vacationStartDate);
        const end = new Date(vacationEndDate);
        if (start > end) {
          newErrors.vacationDateRange = t("errors.dateRangeInvalid");
        }
        // Check if range contains at least one non-Sunday day
        let hasValidDay = false;
        for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          if (!isSunday(dateStr)) {
            hasValidDay = true;
            break;
          }
        }
        if (!hasValidDay) {
          newErrors.vacationDateRange = "Keine gültigen Tage im Zeitraum. Sonntage sind immer frei und können nicht als Urlaub markiert werden.";
        }
      }
    } else if (status === "krank") {
      // Sick day: comment required
      if (!kommentar.trim()) {
        newErrors.kommentar = t("errors.commentRequired");
      }
    } else if (status === "tagesbefreiung") {
      // Day-off exemption:
      // - full-day allowed (no end time)
      // - partial-day allowed (time range)
      if (hasEndTime) {
        if (!normalizedFrom) {
          newErrors.from = t("errors.fromRequired");
        }

        if (normalizedFrom) {
          const hours = calculateHours(normalizedFrom, normalizedTo, 0);
          if (hours === null) {
            newErrors.to = t("errors.endAfterStart");
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // For work entries, calculatedHours must be a valid number (not null)
    if (
      (status === "arbeit" || status === "tagesbefreiung") &&
      hasEndTime &&
      calculatedHours === null
    ) {
      setErrors((prev) => ({ ...prev, to: t("errors.endAfterStart") }));
      return;
    }

    const entry: DayEntry = {
      // For Urlaub we keep the clicked date for display but also pass the explicit range
      date: status === "urlaub" && vacationStartDate ? vacationStartDate : date,
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
      ...(status === "tagesbefreiung" && {
        from: normalizedFrom,
        ...(hasEndTime && {
          to: normalizedTo,
          hours: calculatedHours ?? undefined,
        }),
      }),
      ...(status === "krank" && {
        kommentar,
      }),
      ...(status === "urlaub" && {
        rangeStart: vacationStartDate,
        rangeEnd: vacationEndDate,
      }),
    };

    onSave(entry);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">{t("status")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["arbeit", "urlaub", "krank", "tagesbefreiung"] as DayStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setErrors({});
                // When switching to Urlaub, initialize range to the currently selected day
                if (s === "urlaub") {
                  setVacationStartDate(initialData?.date || date);
                  setVacationEndDate(initialData?.date || date);
                }
              }}
              disabled={isReadOnly}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === s
                  ? "bg-brand text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              } ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {s === "arbeit"
                ? t("statusOptions.work")
                : s === "urlaub"
                  ? t("statusOptions.vacation")
                  : s === "krank"
                    ? t("statusOptions.sick")
                    : t("statusOptions.dayOff")}
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
              {t("labels.project")}
              {hasEndTime && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              id="bauvorhaben"
              value={bauvorhaben}
              onChange={(e) => {
                setBauvorhaben(e.target.value);
                setErrors((prev) => ({ ...prev, bauvorhaben: "" }));
              }}
              disabled={isReadOnly}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                errors.bauvorhaben ? "border-red-500" : "border-border"
              } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              placeholder={t("placeholders.project")}
            />
            {errors.bauvorhaben && (
              <p className="text-xs text-red-600 mt-1">{errors.bauvorhaben}</p>
            )}
          </div>

          {/* Time fields (compact) */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 sm:max-w-[150px]">
              <label htmlFor="from" className="block text-sm font-medium mb-1">
                {t("labels.from")}
              </label>
              <input
                id="from"
                type="time"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setErrors((prev) => ({ ...prev, from: "", to: "" }));
                }}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.from ? "border-red-500" : "border-border"
                } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.from && (
                <p className="text-xs text-red-600 mt-1">{errors.from}</p>
              )}
            </div>

            <div className="flex-1 sm:max-w-[150px]">
              <label htmlFor="to" className="block text-sm font-medium mb-1">
                {t("labels.to")}
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
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.to ? "border-red-500" : "border-border"
                } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.to && (
                <p className="text-xs text-red-600 mt-1">{errors.to}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("helpText.startOnly")}</p>

          {/* Pause */}
          <div>
            <label htmlFor="pause" className="block text-sm font-medium mb-1">
              {t("labels.pause")}
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
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.pause ? "border-red-500" : "border-border"
                } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
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
                  {t("info.hoursCalculated")}:{" "}
                  {calculatedHours !== null ? formatHours(calculatedHours) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Report */}
          <div>
            <label htmlFor="taetigkeit" className="block text-sm font-medium mb-1">
              {t("labels.activity")}
              {hasEndTime && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              id="taetigkeit"
              value={taetigkeit}
              onChange={(e) => {
                setTaetigkeit(e.target.value);
                setErrors((prev) => ({ ...prev, taetigkeit: "" }));
              }}
              disabled={isReadOnly}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                errors.taetigkeit ? "border-red-500" : "border-border"
              } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              placeholder={t("placeholders.activity")}
            />
            {errors.taetigkeit && (
              <p className="text-xs text-red-600 mt-1">{errors.taetigkeit}</p>
            )}
          </div>
        </>
      )}

      {/* Vacation (Urlaub) date range fields */}
      {status === "urlaub" && (
        <>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="vacationStartDate"
                className="block text-sm font-medium mb-1.5 text-foreground"
              >
                {t("labels.from")}
              </label>
              <input
                id="vacationStartDate"
                type="date"
                value={vacationStartDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setVacationStartDate(value);
                  setErrors((prev) => ({
                    ...prev,
                    vacationStartDate: "",
                    vacationDateRange: "",
                  }));
                }}
                disabled={isReadOnly}
                className={`w-[180px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.vacationStartDate || errors.vacationDateRange
                    ? "border-red-500"
                    : "border-border"
                } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.vacationStartDate && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.vacationStartDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="vacationEndDate"
                className="block text-sm font-medium mb-1.5 text-foreground"
              >
                {t("labels.to")}
              </label>
              <input
                id="vacationEndDate"
                type="date"
                value={vacationEndDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setVacationEndDate(value);
                  setErrors((prev) => ({
                    ...prev,
                    vacationEndDate: "",
                    vacationDateRange: "",
                  }));
                }}
                disabled={isReadOnly}
                className={`w-[180px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.vacationEndDate || errors.vacationDateRange
                    ? "border-red-500"
                    : "border-border"
                } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.vacationEndDate && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.vacationEndDate}
                </p>
              )}
            </div>
          </div>

          {errors.vacationDateRange && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600" role="alert">
                {errors.vacationDateRange}
              </p>
            </div>
          )}
        </>
      )}

      {/* Day-off exemption fields */}
      {status === "tagesbefreiung" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 sm:max-w-[150px]">
              <label htmlFor="from" className="block text-sm font-medium mb-1">
                {t("labels.from")}
              </label>
              <input
                id="from"
                type="time"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setErrors((prev) => ({ ...prev, from: "", to: "" }));
                }}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.from ? "border-red-500" : "border-border"
                } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.from && (
                <p className="text-xs text-red-600 mt-1">{errors.from}</p>
              )}
            </div>

            <div className="flex-1 sm:max-w-[150px]">
              <label htmlFor="to" className="block text-sm font-medium mb-1">
                {t("labels.to")}
              </label>
              <input
                id="to"
                type="time"
                value={to}
                onChange={(e) => {
                  const value = e.target.value;
                  setTo(value);
                  setErrors((prev) => (!value ? { ...prev, to: "" } : { ...prev, to: "" }));
                }}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.to ? "border-red-500" : "border-border"
                } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
              />
              {errors.to && (
                <p className="text-xs text-red-600 mt-1">{errors.to}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("helpText.dayOff")}</p>

          {hasEndTime && calculatedHours !== null && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t("preview.dayOffDuration")}: {formatHours(calculatedHours)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sick comment (vacation has no reason field) */}
      {status === "krank" && (
        <div>
          <label htmlFor="kommentar" className="block text-sm font-medium mb-1">
            {t("labels.comment")} *
          </label>
          <textarea
            id="kommentar"
            value={kommentar}
            onChange={(e) => {
              setKommentar(e.target.value);
              setErrors((prev) => ({ ...prev, kommentar: "" }));
            }}
                disabled={isReadOnly}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
              errors.kommentar ? "border-red-500" : "border-border"
            } ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
            placeholder={t("placeholders.commentSick")}
          />
          {errors.kommentar && (
            <p className="text-xs text-red-600 mt-1">{errors.kommentar}</p>
          )}
        </div>
      )}

      {/* Buttons - Show for non-admin or when admin is creating new entry */}
      {!isReadOnly && (
        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-secondary/80"
          >
            {t("buttons.cancel")}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t("buttons.saving") : t("buttons.save")}
          </button>
        </div>
      )}
    </form>
  );
}

