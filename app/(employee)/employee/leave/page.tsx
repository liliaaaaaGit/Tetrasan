"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useState, useEffect } from "react";
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
 * Employee Leave Page
 * Allows employees to submit vacation requests
 */
export default function EmployeeLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leave-requests');
      if (!response.ok) {
        throw new Error('Failed to load leave requests');
      }
      
      const { data } = await response.json();
      // Filter only vacation requests
      const vacationRequests = data.filter((req: LeaveRequest) => req.type === 'vacation');
      setRequests(vacationRequests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
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
          type: 'vacation',
          period_start: formData.startDate,
          period_end: formData.endDate,
          comment: formData.comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit leave request');
      }

      const { data } = await response.json();
      setShowForm(false);
      showToast("Antrag wurde eingereicht.");
      // Reload requests to get updated list
      await loadLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showToast(error instanceof Error ? error.message : 'Fehler beim Einreichen des Antrags.');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Genehmigt';
      case 'rejected': return 'Abgelehnt';
      default: return 'Eingereicht';
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Urlaub"
        button={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Urlaubsantrag</span>
          </button>
        }
      />

      {/* Leave Request Form */}
      {showForm && (
        <LeaveRequestForm
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmitRequest}
          isLoading={isSubmitting}
        />
      )}

      {/* Recent requests */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Lade Anträge...</span>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="p-4 bg-white border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {new Date(request.period_start).toLocaleDateString('de-DE')} - {new Date(request.period_end).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{request.comment}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Eingereicht: {new Date(request.created_at).toLocaleDateString('de-DE')}
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
                  <span>PDF herunterladen</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg">
          <EmptyState message="Noch keine Urlaubsanträge eingereicht" />
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

// Leave Request Form Component
function LeaveRequestForm({ onClose, onSubmit, isLoading }: { onClose: () => void; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string; comment?: string; dateRange?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!startDate) {
      newErrors.startDate = "Bitte Startdatum wählen.";
    }

    if (!endDate) {
      newErrors.endDate = "Bitte Enddatum wählen.";
    }

    if (!comment.trim()) {
      newErrors.comment = "Kommentar ist erforderlich.";
    }

    // Date range validation
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.dateRange = "Das Enddatum muss nach dem Startdatum liegen.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({ startDate, endDate, comment });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6">Urlaubsantrag</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-1.5 text-foreground">
                Von
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate) {
                    setErrors(prev => ({ ...prev, startDate: undefined }));
                  }
                  if (errors.dateRange) {
                    setErrors(prev => ({ ...prev, dateRange: undefined }));
                  }
                }}
                className={`max-w-[200px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.startDate || errors.dateRange ? 'border-red-500' : 'border-border'
                }`}
                placeholder="tt.mm.jjjj"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.startDate}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1.5 text-foreground">
                Bis
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate) {
                    setErrors(prev => ({ ...prev, endDate: undefined }));
                  }
                  if (errors.dateRange) {
                    setErrors(prev => ({ ...prev, dateRange: undefined }));
                  }
                }}
                className={`max-w-[200px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.endDate || errors.dateRange ? 'border-red-500' : 'border-border'
                }`}
                placeholder="tt.mm.jjjj"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600" role="alert">{errors.endDate}</p>
              )}
            </div>

            {errors.dateRange && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600" role="alert">{errors.dateRange}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-1.5 text-foreground">
                Kommentar / Grund für den Urlaub
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
                  errors.comment ? 'border-red-500' : 'border-border'
                }`}
                rows={4}
                placeholder="Grund für den Urlaub..."
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
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Einreichen..." : "Einreichen"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}