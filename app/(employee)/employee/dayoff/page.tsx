"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Plus, Loader2, Download } from "lucide-react";

interface LeaveRequest {
  id: string;
  type: 'vacation' | 'day_off';
  period_start: string;
  period_end: string;
  comment: string;
  status: 'submitted' | 'approved' | 'rejected';
  created_at: string;
}

/**
 * Employee Day Off Page
 * Allows employees to submit day-off requests
 */
export default function EmployeeDayOffPage() {
  const tRequests = useTranslations("notifications.requests");
  const tDayOff = useTranslations("dayOffPage");
  const tDayOffForm = useTranslations("dayOffPage.form");
  const locale = useLocale();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadDayOffRequests();
  }, []);

  const loadDayOffRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leave-requests');
      if (!response.ok) {
        throw new Error('Failed to load day-off requests');
      }
      
      const { data } = await response.json();
      // Filter only day_off requests
      const dayOffRequests = data.filter((req: LeaveRequest) => req.type === 'day_off');
      setRequests(dayOffRequests);
    } catch (error) {
      console.error('Error loading day-off requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'day_off',
          period_start: formData.date,
          period_end: formData.date, // Same day for day-off
          comment:
            formData.mode === 'partial' && formData.timeFrom && formData.timeTo
              ? `${formData.comment} (${tDayOffForm("timeAnnotation", { from: formData.timeFrom, to: formData.timeTo })})`
              : formData.comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit day-off request');
      }

      const { data } = await response.json();
      setShowForm(false);
      showToast(tRequests("submitSuccess"));
      // Reload requests to get updated list
      await loadDayOffRequests();
    } catch (error) {
      console.error('Error submitting day-off request:', error);
      showToast(error instanceof Error ? error.message : tRequests("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusText = (status: string) => tDayOff(`status.${status}` as const);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      <PageHeader
        title={tDayOff("title")}
        button={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">{tDayOff("newRequest")}</span>
          </button>
        }
      />

      {/* Day Off Request Form */}
      {showForm && (
        <DayOffRequestForm
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmitRequest}
          isLoading={isSubmitting}
        />
      )}

      {/* Recent requests */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">{tDayOff("loading")}</span>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="p-4 bg-white border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {new Date(request.period_start).toLocaleDateString(locale)}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{request.comment}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {tDayOff("submittedOn", {
                  date: new Date(request.created_at).toLocaleDateString(locale),
                })}
              </p>
              <div className="mt-3">
                <button
                  onClick={() => {
                    const url = `/api/pdf/${request.id}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>{tDayOff("downloadPdf")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg">
          <EmptyState message={tDayOff("empty")} />
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

// Day Off Request Form Component
function DayOffRequestForm({ onClose, onSubmit, isLoading }: { onClose: () => void; onSubmit: (data: any) => void; isLoading: boolean }) {
  const tForm = useTranslations("dayOffPage.form");
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [errors, setErrors] = useState<{ date?: string; comment?: string; timeFrom?: string; timeTo?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!date) {
      newErrors.date = tForm("dateRequired");
    }

    if (!comment.trim()) {
      newErrors.comment = tForm("commentRequired");
    }
    if (mode === 'partial') {
      if (!timeFrom) newErrors.timeFrom = tForm("timeFromRequired");
      if (!timeTo) newErrors.timeTo = tForm("timeToRequired");
      if (timeFrom && timeTo && timeFrom >= timeTo) {
        newErrors.timeTo = tForm("timeOrder");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      date,
      comment,
      mode,
      timeFrom: mode === 'partial' ? timeFrom : undefined,
      timeTo: mode === 'partial' ? timeTo : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6">{tForm("title")}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1.5 text-foreground">
                {tForm("dateLabel")}
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) {
                    setErrors(prev => ({ ...prev, date: undefined }));
                  }
                }}
                className={`w-[180px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.date ? "border-red-500" : "border-border"
                }`}
                placeholder={tForm("datePlaceholder")}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.date}</p>
              )}
            </div>

            {/* Ganztags vs Zeitfenster */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">{tForm("typeLabel")}</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="dayoff-mode"
                    value="full"
                    checked={mode === 'full'}
                    onChange={() => setMode('full')}
                  />
                  <span>{tForm("typeFull")}</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="dayoff-mode"
                    value="partial"
                    checked={mode === 'partial'}
                    onChange={() => setMode('partial')}
                  />
                  <span>{tForm("typePartial")}</span>
                </label>
              </div>
            </div>

            {mode === 'partial' && (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div>
                  <label htmlFor="timeFrom" className="block text-sm font-medium mb-1.5 text-foreground">
                    {tForm("timeFromLabel")}
                  </label>
                  <input
                    id="timeFrom"
                    type="time"
                    value={timeFrom}
                    onChange={(e) => {
                      setTimeFrom(e.target.value);
                      if (errors.timeFrom) setErrors(prev => ({ ...prev, timeFrom: undefined }));
                    }}
                    className={`w-[180px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.timeFrom ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.timeFrom && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.timeFrom}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="timeTo" className="block text-sm font-medium mb-1.5 text-foreground">
                    {tForm("timeToLabel")}
                  </label>
                  <input
                    id="timeTo"
                    type="time"
                    value={timeTo}
                    onChange={(e) => {
                      setTimeTo(e.target.value);
                      if (errors.timeTo) setErrors(prev => ({ ...prev, timeTo: undefined }));
                    }}
                    className={`w-[180px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.timeTo ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.timeTo && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.timeTo}</p>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-1.5 text-foreground">
                {tForm("commentLabel")}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (errors.comment) {
                    setErrors(prev => ({ ...prev, comment: undefined }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                  errors.comment ? "border-red-500" : "border-border"
                }`}
                rows={4}
                placeholder={tForm("commentPlaceholder")}
              />
              {errors.comment && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.comment}</p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                {tForm("cancel")}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? tForm("submitting") : tForm("submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}