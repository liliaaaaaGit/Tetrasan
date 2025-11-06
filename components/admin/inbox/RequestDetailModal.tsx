"use client";

import React from "react";
import { X, Check, XCircle, Calendar, User, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeDe } from "@/lib/date-utils";

interface LeaveRequest {
  id: string;
  type: 'vacation' | 'day_off';
  status: string;
  period_start: string;
  period_end: string;
  comment?: string;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  employee: Employee | null;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * RequestDetailModal Component
 * Shows full details of a leave request with approve/reject actions
 */
export function RequestDetailModal({
  isOpen,
  onClose,
  request,
  employee,
  onApprove,
  onReject,
  isLoading = false,
}: RequestDetailModalProps) {
  if (!isOpen || !request) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Eingereicht';
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): "primary" | "secondary" | "outline" => {
    switch (status) {
      case 'approved':
        return 'secondary'; // Green
      case 'rejected':
        return 'secondary'; // Red
      default:
        return 'primary'; // Blue
    }
  };

  const requestTypeLabel = request.type === 'vacation' ? 'Urlaubsantrag' : 'Tagesbefreiung';
  const isSubmitted = request.status === 'submitted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{requestTypeLabel}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          {employee && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Mitarbeiter</p>
                <p className="font-medium">{employee.full_name}</p>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={getStatusVariant(request.status)}>
              {getStatusLabel(request.status)}
            </Badge>
          </div>

          {/* Date Range */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Zeitraum</p>
              {request.type === 'day_off' ? (
                <p className="font-medium">{formatDate(request.period_start)}</p>
              ) : (
                <p className="font-medium">
                  {formatDate(request.period_start)} - {formatDate(request.period_end)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Eingereicht am: {formatDateTimeDe(request.created_at)}
              </p>
            </div>
          </div>

          {/* Comment */}
          {request.comment && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Kommentar</p>
                <p className="text-sm whitespace-pre-wrap">{request.comment}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            {/* Download PDF Button */}
            <button
              onClick={() => {
                const url = `/api/pdf/${request.id}`;
                window.open(url, '_blank');
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>PDF herunterladen</span>
            </button>

            {/* Approve/Reject - Only show for submitted requests */}
            {isSubmitted && (
              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>Genehmigen</span>
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Ablehnen</span>
                </button>
              </div>
            )}
          </div>

          {/* Info for non-submitted requests */}
          {!isSubmitted && (
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                Dieser Antrag wurde bereits {getStatusLabel(request.status).toLowerCase()}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

