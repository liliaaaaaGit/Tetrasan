"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, KeyRound, Copy, CheckCircle2, AlertCircle } from "lucide-react";

export default function PasswordResetsPage() {
  const [personalNumber, setPersonalNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage] = useState(
    "Geben Sie die Personalnummer des Mitarbeiters ein, um ein temporäres Passwort zu erzeugen."
  );
  const [modalState, setModalState] = useState<{ open: boolean; password: string | null }>({
    open: false,
    password: null,
  });
  const [passwordCopied, setPasswordCopied] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPasswordCopied(false);

    const trimmed = personalNumber.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Bitte eine gültige Personalnummer (5 Ziffern) eingeben.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalNumber: trimmed }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Passwort konnte nicht erstellt werden.");
      }

      if (!payload?.tempPassword) {
        throw new Error("Server hat kein temporäres Passwort zurückgegeben.");
      }

      setModalState({ open: true, password: payload.tempPassword });
      setPersonalNumber("");
    } catch (err) {
      console.error("[AdminPasswordReset] Error:", err);
      setError(err instanceof Error ? err.message : "Passwort konnte nicht erstellt werden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!modalState.password) return;
    try {
      await navigator.clipboard.writeText(modalState.password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (err) {
      console.error("[AdminPasswordReset] Clipboard error:", err);
      setError("Konnte Passwort nicht in die Zwischenablage kopieren.");
    }
  };

  return (
    <div>
      <PageHeader title="Passwort-Reset" />

      {infoMessage && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {infoMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        <div>
          <label htmlFor="personalNumber" className="mb-1 block text-sm font-medium text-foreground">
            Personalnummer
          </label>
          <input
            id="personalNumber"
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            value={personalNumber}
            onChange={(event) => setPersonalNumber(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="z. B. 01234"
            disabled={isSubmitting}
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          <span>{isSubmitting ? "Erstellt…" : "Temporäres Passwort setzen"}</span>
        </button>
      </form>

      {modalState.open && modalState.password && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-2 text-brand">
              <KeyRound className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-foreground">Temporäres Passwort erzeugt</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Bitte dieses Passwort einmalig sicher an den Mitarbeiter weitergeben. Beim nächsten Login muss es geändert werden.
            </p>
            <div className="mb-4 rounded-md border border-dashed border-brand bg-brand/5 p-4 text-center">
              <span className="break-all font-mono text-lg font-semibold text-brand">
                {modalState.password}
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                {passwordCopied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {passwordCopied ? "Kopiert" : "In Zwischenablage kopieren"}
              </button>
              <button
                onClick={() => setModalState({ open: false, password: null })}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

