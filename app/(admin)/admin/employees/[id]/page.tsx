"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CalendarView } from "@/components/shared/CalendarView";
import {
  Info,
  Trash2,
  RefreshCw,
  Loader2,
  Check,
  X,
  Download,
  Pencil,
  KeyRound,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { getInitialTab, scrollToHash, TabValue } from "@/lib/deeplink";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "aktiv" | "inaktiv";
}

interface TimesheetEntry {
  id: string;
  date: string;
  time_from: string;
  time_to: string;
  break_minutes: number;
  hours_decimal: number;
  status: string;
  activity_note?: string;
  comment?: string;
}

interface LeaveRequest {
  id: string;
  type: string;
  period_start: string;
  period_end: string;
  comment: string;
  status: string;
  created_at: string;
}

interface EmployeeData {
  profile: Employee;
  timesheetEntries: TimesheetEntry[];
  leaveRequests: LeaveRequest[];
}

/**
 * Admin Employee Detail Page
 * Shows individual employee's hours, day off, and leave records
 * Features:
 * - Mobile tabs for different views
 * - Deep-link support (?focus=hours|dayoff|leave, #req-123)
 * - Approve/reject leave requests
 * - View timesheet entries
 */
export default function AdminEmployeeDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("hours");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; id: string } | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    request: LeaveRequest | null;
    values: { period_start: string; period_end: string; comment: string };
  }>({ open: false, request: null, values: { period_start: '', period_end: '', comment: '' } });
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ open: boolean; password: string | null }>({
    open: false,
    password: null,
  });
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false);
  const tAdminNotifications = useTranslations("notifications.admin");

  useEffect(() => {
    loadEmployeeData();
  }, [params.id]);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const initialTab = getInitialTab(searchParams, hash, "hours");
    setActiveTab(initialTab);
    if (hash) {
      scrollToHash(hash);
    }
  }, [searchParams]);

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees/${params.id}`);
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          // Not authorized - redirect to employee list
          router.push('/admin/employees');
          return;
        }
        throw new Error('Failed to load employee data');
      }
      
      const { data } = await response.json();
      // Map database profile to Employee interface
      if (data && data.profile) {
        setEmployeeData({
          ...data,
          profile: {
            id: data.profile.id,
            name: data.profile.full_name || data.profile.email || 'Unbekannt',
            email: data.profile.email,
            phone: data.profile.phone || '',
            status: data.profile.active ? 'aktiv' : 'inaktiv',
          },
        });
      } else {
        setEmployeeData(data);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
      router.push('/admin/employees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTempPassword = async () => {
    if (!employeeData?.profile?.id) return;
    try {
      setResetError(null);
      setTempPasswordCopied(false);
      setIsResettingPassword(true);

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: employeeData.profile.id }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Temporäres Passwort konnte nicht erstellt werden.');
      }

      if (!payload?.tempPassword) {
        throw new Error('Server hat kein temporäres Passwort zurückgegeben.');
      }

      setTempPasswordModal({ open: true, password: payload.tempPassword });
      showToast(tAdminNotifications("tempPasswordCreated"), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fehler beim Erstellen des temporären Passworts.';
      console.error('[AdminEmployeeDetail] Reset password error:', error);
      setResetError(message);
      showToast(message, 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyTempPassword = async () => {
    if (!tempPasswordModal.password) return;
    try {
      await navigator.clipboard.writeText(tempPasswordModal.password);
      setTempPasswordCopied(true);
      setTimeout(() => setTempPasswordCopied(false), 2000);
    } catch (error) {
      console.error('[AdminEmployeeDetail] Clipboard error:', error);
      setResetError('Konnte Passwort nicht in die Zwischenablage kopieren.');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApproveRequest = async (requestId: string) => {
    if (processingRequest) return;
    
    try {
      setProcessingRequest(requestId);
      const response = await fetch(`/api/leave-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve request');
      }

      // Reload data to get updated status
      await loadEmployeeData();
      showToast(tAdminNotifications("approveSuccess"), 'success');
    } catch (error) {
      console.error('Error approving request:', error);
      showToast(error instanceof Error ? error.message : tAdminNotifications("approveError"), 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (processingRequest) return;
    
    try {
      setProcessingRequest(requestId);
      const response = await fetch(`/api/leave-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject request');
      }

      // Reload data to get updated status
      await loadEmployeeData();
      showToast(tAdminNotifications("rejectSuccess"), 'success');
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast(error instanceof Error ? error.message : tAdminNotifications("rejectError"), 'error');
    } finally {
      setProcessingRequest(null);
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

  const openEdit = (request: LeaveRequest) => {
    setEditModal({
      open: true,
      request,
      values: {
        period_start: request.period_start?.slice(0, 10) || '',
        period_end: request.period_end?.slice(0, 10) || '',
        comment: request.comment || '',
      },
    });
  };

  const saveEdit = async () => {
    if (!editModal.request) return;
    try {
      setProcessingRequest(editModal.request.id);
      const res = await fetch(`/api/leave-requests/${editModal.request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editModal.request.type,
          period_start: editModal.values.period_start,
          period_end: editModal.request.type === 'day_off' ? editModal.values.period_start : editModal.values.period_end,
          comment: editModal.values.comment,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Update fehlgeschlagen');
      }
      await loadEmployeeData();
      showToast(tAdminNotifications("updateSuccess"), 'success');
      setEditModal({ open: false, request: null, values: { period_start: '', period_end: '', comment: '' } });
    } catch (e) {
      console.error('Edit error', e);
      showToast(e instanceof Error ? e.message : tAdminNotifications("updateError"), 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (processingRequest) return;
    try {
      setProcessingRequest(requestId);
      const res = await fetch(`/api/leave-requests/${requestId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Löschen fehlgeschlagen');
      }
      await loadEmployeeData();
      showToast(tAdminNotifications("deleteSuccess"), 'success');
    } catch (e) {
      console.error('Delete error', e);
      showToast(e instanceof Error ? e.message : tAdminNotifications("deleteError"), 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Lade Mitarbeiterdaten...</span>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="border border-border rounded-lg">
        <EmptyState message="Mitarbeiter nicht gefunden" />
      </div>
    );
  }

  const { profile, timesheetEntries, leaveRequests } = employeeData;

  return (
    <div>
      {/* Tabs with employee name above */}
      <div className="mb-4">
        {/* Employee name above tabs */}
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-foreground">{profile.name}</h2>
          <div className="flex flex-col md:items-end gap-1">
            <button
              onClick={handleGenerateTempPassword}
              disabled={isResettingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResettingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              <span>Temporäres Passwort setzen</span>
            </button>
            <p className="text-xs text-muted-foreground">
              Passwort wird einmalig angezeigt und muss weitergegeben werden.
            </p>
            {resetError && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{resetError}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tab bar */}
        <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("hours")}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === "hours"
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Stunden
          </button>
          <button
            onClick={() => setActiveTab("dayoff")}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === "dayoff"
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Tagesbefreiung
          </button>
          <button
            onClick={() => setActiveTab("leave")}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === "leave"
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Urlaub
          </button>
        </div>
        </div>
      </div>

      {/* Hours Tab */}
      {activeTab === "hours" && (
        <CalendarView
          employeeId={params.id}
          employeeName={profile.name}
          isAdmin={true}
        />
      )}

      {/* Day Off Tab */}
      {activeTab === "dayoff" && (
        <div>
          {leaveRequests.filter(r => r.type === 'day_off').length > 0 ? (
            <div className="space-y-4">
              {leaveRequests
                .filter(r => r.type === 'day_off')
                .map((request) => (
                <div key={request.id} className="p-4 bg-white border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {new Date(request.period_start).toLocaleDateString('de-DE')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{request.comment}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2 flex-wrap">
                      {/* PDF Download Button */}
                      <button
                        onClick={() => {
                          const url = `/api/pdf/${request.id}`;
                          window.open(url, '_blank');
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        PDF herunterladen
                      </button>
                      {/* Edit/Delete - always visible */}
                      <button
                        onClick={() => openEdit(request)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {processingRequest === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Löschen
                      </button>
                    </div>
                    {request.status === 'submitted' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Genehmigen
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Ablehnen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-lg">
              <EmptyState message="Noch keine Tagesbefreiungen" />
            </div>
          )}
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === "leave" && (
        <div>
          {leaveRequests.filter(r => r.type === 'vacation').length > 0 ? (
            <div className="space-y-4">
              {leaveRequests
                .filter(r => r.type === 'vacation')
                .map((request) => (
                <div key={request.id} className="p-4 bg-white border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {new Date(request.period_start).toLocaleDateString('de-DE')} - {new Date(request.period_end).toLocaleDateString('de-DE')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{request.comment}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2 flex-wrap">
                      {/* PDF Download Button */}
                      <button
                        onClick={() => {
                          const url = `/api/pdf/${request.id}`;
                          window.open(url, '_blank');
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        PDF herunterladen
                      </button>
                      {/* Edit/Delete - always visible */}
                      <button
                        onClick={() => openEdit(request)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {processingRequest === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Löschen
                      </button>
                    </div>
                    {request.status === 'submitted' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Genehmigen
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Ablehnen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-lg">
              <EmptyState message="Noch keine Urlaubsanträge" />
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {tempPasswordModal.open && tempPasswordModal.password && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-brand mb-3">
              <KeyRound className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-foreground">Temporäres Passwort</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Dieses Passwort einmalig sicher an den Mitarbeiter weitergeben. Beim nächsten Login sollte es sofort geändert werden.
            </p>
            <div className="mb-4 rounded-md border border-dashed border-brand bg-brand/5 p-4 text-center">
              <span className="font-mono text-lg font-semibold text-brand break-all">
                {tempPasswordModal.password}
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCopyTempPassword}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                {tempPasswordCopied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {tempPasswordCopied ? 'Kopiert' : 'In Zwischenablage kopieren'}
              </button>
              <button
                onClick={() => setTempPasswordModal({ open: false, password: null })}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Aktion bestätigen"
        description="Sind Sie sicher, dass Sie diese Aktion ausführen möchten?"
        onConfirm={() => {
          if (pendingAction) {
            if (pendingAction.type === 'approve') {
              handleApproveRequest(pendingAction.id);
            } else if (pendingAction.type === 'reject') {
              handleRejectRequest(pendingAction.id);
            }
          }
          setShowConfirmDialog(false);
          setPendingAction(null);
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingAction(null);
        }}
      />

      {/* Simple Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Antrag bearbeiten</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1">Von</label>
                <input
                  type="date"
                  value={editModal.values.period_start}
                  onChange={(e) => setEditModal(s => ({ ...s, values: { ...s.values, period_start: e.target.value } }))}
                  className="w-full px-3 py-2 border border-border rounded"
                />
              </div>
              {editModal.request?.type === 'vacation' && (
                <div>
                  <label className="block text-xs mb-1">Bis</label>
                  <input
                    type="date"
                    value={editModal.values.period_end}
                    onChange={(e) => setEditModal(s => ({ ...s, values: { ...s.values, period_end: e.target.value } }))}
                    className="w-full px-3 py-2 border border-border rounded"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs mb-1">Grund / Kommentar</label>
                <textarea
                  value={editModal.values.comment}
                  onChange={(e) => setEditModal(s => ({ ...s, values: { ...s.values, comment: e.target.value } }))}
                  className="w-full px-3 py-2 border border-border rounded"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditModal({ open: false, request: null, values: { period_start: '', period_end: '', comment: '' } })}
                className="px-3 py-1.5 text-xs rounded border border-border"
              >
                Abbrechen
              </button>
              <button
                onClick={saveEdit}
                disabled={!!processingRequest}
                className="px-3 py-1.5 text-xs rounded bg-brand text-white disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}