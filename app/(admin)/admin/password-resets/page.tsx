"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, Key, CheckCircle2, XCircle } from "lucide-react";
import { formatDateTimeDe } from "@/lib/date-utils";

interface PasswordResetRequest {
  id: string;
  user_id: string;
  personal_number: string;
  status: "open" | "done" | "cancelled";
  created_at: string;
  processed_at: string | null;
  employee_name?: string;
}

/**
 * Admin Password Reset Requests Page
 * Allows admins to view and process employee password reset requests
 */
export default function PasswordResetsPage() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    loadResetRequests();
  }, []);

  const loadResetRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/password-resets");
      
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Reset-Anfragen");
      }

      const payload = await response.json();
      if (payload?.error) {
        setError(payload.error);
      } else {
        setError("");
      }
      setRequests(payload?.data || []);
    } catch (err) {
      console.error("[PasswordResets] Error loading requests:", err);
      setError("Fehler beim Laden der Reset-Anfragen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (request: PasswordResetRequest) => {
    try {
      setProcessingId(request.id);

      const response = await fetch(`/api/admin/password-resets/${request.id}/process`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Zurücksetzen des Passworts");
      }

      const { data } = await response.json();
      
      // Show modal with temporary password
      setTempPassword(data.tempPassword);
      setEmployeeName(request.employee_name || request.personal_number);
      setShowPasswordModal(true);

      // Reload requests
      await loadResetRequests();
    } catch (err) {
      console.error("[PasswordResets] Error processing request:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Zurücksetzen des Passworts");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter only open requests
  const openRequests = requests.filter((r) => r.status === "open");

  return (
    <div>
      <PageHeader title="Passwort-Reset-Anfragen" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Lade Anfragen...</span>
        </div>
      ) : openRequests.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Keine offenen Reset-Anfragen</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Personalnummer</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Mitarbeiter</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Angefordert am</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {openRequests.map((request) => (
                <tr key={request.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">{request.personal_number}</td>
                  <td className="px-4 py-3 text-sm">
                    {request.employee_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateTimeDe(request.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <XCircle className="h-3 w-3" />
                      Offen
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleResetPassword(request)}
                      disabled={processingId === request.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-brand text-white rounded-md hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingId === request.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Wird verarbeitet...</span>
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          <span>Passwort zurücksetzen</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Temporäres Passwort erstellt</h3>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Mitarbeiter:</strong> {employeeName}
              </p>
              <p className="text-sm text-blue-900 mb-2">
                <strong>Temporäres Passwort:</strong>
              </p>
              <div className="bg-white border border-blue-300 rounded p-3 font-mono text-lg font-bold text-center">
                {tempPassword}
              </div>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-900">
                <strong>⚠️ Wichtig:</strong> Bitte dieses Passwort sicher an den Mitarbeiter übermitteln
                (z. B. persönlich oder telefonisch). Der Mitarbeiter sollte das Passwort beim ersten
                Login ändern.
              </p>
            </div>

            <button
              onClick={() => {
                setShowPasswordModal(false);
                setTempPassword("");
                setEmployeeName("");
              }}
              className="w-full px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

