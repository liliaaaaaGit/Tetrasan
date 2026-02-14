"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { InboxFilters } from "@/components/admin/inbox/InboxFilters";
import { InboxTable } from "@/components/admin/inbox/InboxTable";
import { RequestDetailModal } from "@/components/admin/inbox/RequestDetailModal";
import { Inbox as InboxIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ApiInboxItem {
  id: string;
  kind: string;
  is_read: boolean;
  created_at: string;
  request?: {
    id: string;
    type: 'vacation' | 'day_off';
    status: string;
    period_start?: string;
    period_end?: string;
    comment?: string;
    created_at?: string;
  } | null;
  employee?: { id: string; full_name: string; email: string } | null;
}

interface UiInboxEvent {
  id: string;
  kind: string;
  createdAt: string;
  isRead: boolean;
  employeeId?: string;
  employeeName: string;
  employeeEmail?: string;
  requestId?: string;
  requestType?: 'vacation' | 'day_off';
  requestStatus?: string;
  requestPeriodStart?: string;
  requestPeriodEnd?: string;
  requestComment?: string;
  requestCreatedAt?: string;
  status: string; // mapped label
}

/**
 * Admin Inbox Page
 * Shows incoming requests and events (leave, day-off, etc.)
 * Features:
 * - Search by employee name or event type
 * - Filter by read/unread status
 * - Filter by event type (Urlaub/Tagesbefreiung)
 * - Sort by date (newest/oldest first)
 * - Toggle read/unread status
 * - Deep-link to employee detail page
 * - Unread counter
 */
export default function AdminInboxPage() {
  const [events, setEvents] = useState<UiInboxEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<UiInboxEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "leave_request_submitted" | "day_off_request_submitted">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    loadInboxEvents();
  }, []);

  function mapRequestStatus(status?: string): string {
    switch (status) {
      case 'submitted':
      case 'eingereicht':
        return 'Eingereicht';
      case 'approved':
      case 'genehmigt':
        return 'Genehmigt';
      case 'rejected':
      case 'abgelehnt':
        return 'Abgelehnt';
      default:
        return 'Eingereicht';
    }
  }

  const loadInboxEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/inbox-events');
      if (!response.ok) {
        throw new Error('Failed to load inbox events');
      }
      
      const { data, unread } = await response.json();
      const mapped: UiInboxEvent[] = (data as ApiInboxItem[]).map((e) => ({
        id: e.id,
        kind: e.kind,
        createdAt: e.created_at,
        isRead: e.is_read,
        employeeId: e.employee?.id,
        employeeName: e.employee?.full_name || "Unbekannt",
        employeeEmail: e.employee?.email,
        requestId: e.request?.id,
        requestType: e.request?.type,
        requestStatus: e.request?.status,
        requestPeriodStart: e.request?.period_start,
        requestPeriodEnd: e.request?.period_end,
        requestComment: e.request?.comment,
        requestCreatedAt: e.request?.created_at,
        status: mapRequestStatus(e.request?.status),
      }));
      setEvents(mapped);
      setUnreadCount(unread || 0);
    } catch (error) {
      console.error('Error loading inbox events:', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      // Search filter
      if (searchTerm) {
        const employeeName = event.employeeName?.toLowerCase() || '';
        const eventType = event.kind.toLowerCase();
        if (!employeeName.includes(searchTerm.toLowerCase()) && 
            !eventType.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Read filter
      if (readFilter === 'read' && !event.isRead) return false;
      if (readFilter === 'unread' && event.isRead) return false;

      // Type filter
      if (typeFilter !== 'all' && event.kind !== typeFilter) return false;

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleToggleRead = async (eventId: string, currentReadState: boolean) => {
    const newReadState = !currentReadState;
    
    try {
      // Optimistic update: update UI immediately
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, isRead: newReadState } : e
      ));
      
      // Update unread count optimistically
      if (newReadState) {
        // Marking as read: decrease count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        // Marking as unread: increase count
        setUnreadCount(prev => prev + 1);
      }

      // Call API to update in database
      const response = await fetch('/api/inbox-events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds: [eventId],
          isRead: newReadState,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle read status');
      }

      // Trigger layout refresh for badge count (DB-authoritative)
      window.dispatchEvent(new CustomEvent('inbox-updated'));
      
      // Optionally re-fetch to ensure DB truth (but optimistic update should be sufficient)
      // await loadInboxEvents();
    } catch (error) {
      console.error('Error toggling read status:', error);
      
      // Revert optimistic update on error
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, isRead: currentReadState } : e
      ));
      
      // Revert unread count
      if (newReadState) {
        setUnreadCount(prev => prev + 1);
      } else {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      alert('Fehler beim Ändern des Lesestatus.');
    }
  };

  const handleOpenRequest = async (event: UiInboxEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    
    // Mark as read when opening modal
    if (!event.isRead && event.id) {
      try {
        const response = await fetch('/api/inbox-events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventIds: [event.id],
            isRead: true,
          }),
        });

        if (response.ok) {
          // Update local state
          setEvents(prev => prev.map(e => 
            e.id === event.id ? { ...e, isRead: true } : e
          ));
          // Update unread count
          setUnreadCount(prev => Math.max(0, prev - 1));
          // Trigger layout refresh
          window.dispatchEvent(new CustomEvent('inbox-updated'));
        }
      } catch (error) {
        console.error('Error marking event as read:', error);
      }
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setIsActionLoading(true);
      const response = await fetch(`/api/leave-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      // Reload inbox to get updated status
      await loadInboxEvents();
      // Notify layout to refresh badge count
      window.dispatchEvent(new CustomEvent('inbox-updated'));
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Fehler beim Genehmigen des Antrags.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setIsActionLoading(true);
      const response = await fetch(`/api/leave-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      // Reload inbox to get updated status
      await loadInboxEvents();
      // Notify layout to refresh badge count
      window.dispatchEvent(new CustomEvent('inbox-updated'));
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Fehler beim Ablehnen des Antrags.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header with unread counter */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Postfach</h1>
          {unreadCount > 0 && (
            <Badge variant="primary" className="px-3 py-1">
              Ungelesen: {unreadCount}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Eingehende Anträge und Hinweise
        </p>
      </div>

      {/* Filters */}
      <InboxFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Results count */}
      {filteredEvents.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredEvents.length} {filteredEvents.length === 1 ? "Eintrag" : "Einträge"}
          {(searchTerm || readFilter !== "all" || typeFilter !== "all") && 
            ` gefunden`}
        </div>
      )}

      {/* Event table or empty state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Lade Postfach...</span>
        </div>
      ) : filteredEvents.length > 0 ? (
        <InboxTable
          events={filteredEvents}
          onOpen={handleOpenRequest}
          onToggleRead={handleToggleRead}
          onDelete={async (eventId) => {
            try {
              const res = await fetch(`/api/inbox-events/${eventId}`, { method: 'DELETE' });
              if (!res.ok) throw new Error('Delete failed');
              // Remove from UI and adjust unread counter
              const wasUnread = events.find(e => e.id === eventId)?.isRead === false;
              setEvents(prev => prev.filter(e => e.id !== eventId));
              if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
              // Trigger layout refresh for badge count
              window.dispatchEvent(new CustomEvent('inbox-updated'));
            } catch (err) {
              alert('Löschen nicht möglich.');
            }
          }}
        />
      ) : (
        <div className="border border-border rounded-lg">
          <EmptyState
            message="Keine Einträge gefunden"
            icon={<InboxIcon className="h-12 w-12" />}
          />
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedEvent && selectedEvent.requestId && (
        <RequestDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          request={
            selectedEvent.requestId && selectedEvent.requestPeriodStart
              ? {
                  id: selectedEvent.requestId,
                  type: selectedEvent.requestType || 'vacation',
                  status: selectedEvent.requestStatus || 'submitted',
                  period_start: selectedEvent.requestPeriodStart,
                  period_end: selectedEvent.requestPeriodEnd || selectedEvent.requestPeriodStart,
                  comment: selectedEvent.requestComment,
                  created_at: selectedEvent.requestCreatedAt || selectedEvent.createdAt,
                }
              : null
          }
          employee={
            selectedEvent.employeeId
              ? {
                  id: selectedEvent.employeeId,
                  full_name: selectedEvent.employeeName,
                  email: selectedEvent.employeeEmail || '',
                }
              : null
          }
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
}