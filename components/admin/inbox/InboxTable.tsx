"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
// InboxEvent interface and helper functions moved inline
import { ExternalLink, Eye, EyeOff, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTimeDe } from "@/lib/date-utils";

interface InboxEvent {
  id: string;
  kind: string;
  createdAt: string;
  isRead: boolean;
  employeeId?: string;
  employeeName: string;
  requestId?: string;
  requestType?: 'vacation' | 'day_off';
  status: string;
}

interface InboxTableProps {
  events: InboxEvent[];
  onToggleRead: (eventId: string) => void;
  onOpen?: (event: InboxEvent) => void;
  onDelete?: (eventId: string) => void;
}

function getEventTypeLabel(kind: string): string {
  switch (kind) {
    case "leave_request_submitted":
      return "Urlaubsantrag";
    case "day_off_request_submitted":
      return "Tagesbefreiung";
    default:
      return "Unbekannt";
  }
}

function getEventDeepLink(event: InboxEvent): string {
  const focus = event.kind === "leave_request_submitted" ? "leave" : "dayoff";
  const requestId = event.requestId || event.id;
  const employeeId = event.employeeId || 'unknown';
  return `/admin/employees/${employeeId}?focus=${focus}#req-${requestId}`;
}

/**
 * InboxTable Component
 * Displays inbox events with actions
 */
export function InboxTable({ events, onToggleRead, onOpen, onDelete }: InboxTableProps) {
  const router = useRouter();

  const formatDate = (isoDate: string) => formatDateTimeDe(isoDate);

  const handleOpen = (event: InboxEvent) => {
    if (onOpen && event.requestId) {
      // Use modal if handler provided
      onOpen(event);
    } else if (event.employeeId) {
      // Fallback to navigation if no modal handler
      const url = getEventDeepLink(event);
      router.push(url);
    }
  };

  const handleDownload = (event: InboxEvent) => {
    if (!event.employeeId) return;
    const url = `/api/contracts/download?employeeId=${encodeURIComponent(event.employeeId)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                Datum
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                Mitarbeiter
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                Typ
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                Gelesen
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((event) => (
              <tr
                key={event.id}
                className={cn(
                  "transition-colors",
                  !event.isRead && "bg-blue-50/50"
                )}
              >
                <td className="px-4 py-3 text-sm">{formatDate(event.createdAt)}</td>
                <td className="px-4 py-3 text-sm font-medium">{event.employeeName}</td>
                <td className="px-4 py-3">
                  <Badge variant={event.kind === "leave_request_submitted" ? "primary" : "secondary"}>
                    {getEventTypeLabel(event.kind)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{event.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={event.isRead ? "secondary" : "primary"}>
                    {event.isRead ? "Gelesen" : "Ungelesen"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpen(event)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Öffnen</span>
                    </button>
                    <button
                      onClick={() => handleDownload(event)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
                      title="Vertrag herunterladen"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(event.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        title="Nachricht löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleRead(event.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
                      aria-label={event.isRead ? "Als ungelesen markieren" : "Als gelesen markieren"}
                    >
                      {event.isRead ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {events.map((event) => (
          <div
            key={event.id}
            className={cn(
              "p-4 transition-colors",
              !event.isRead && "bg-blue-50/50"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-sm mb-1">{event.employeeName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
              </div>
              <Badge variant={event.isRead ? "secondary" : "primary"}>
                {event.isRead ? "Gelesen" : "Ungelesen"}
              </Badge>
            </div>
            
            <div className="flex gap-2 mb-3">
              <Badge variant={event.kind === "leave_request_submitted" ? "primary" : "secondary"}>
                {getEventTypeLabel(event.kind)}
              </Badge>
              <Badge variant="outline">{event.status}</Badge>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleOpen(event)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Öffnen</span>
              </button>
              <button
                onClick={() => handleDownload(event)}
                className="flex items-center justify-center px-3 py-2 text-sm bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
                title="Vertrag herunterladen"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => onToggleRead(event.id)}
                className="flex items-center justify-center px-3 py-2 text-sm bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
                aria-label={event.isRead ? "Als ungelesen markieren" : "Als gelesen markieren"}
              >
                {event.isRead ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

