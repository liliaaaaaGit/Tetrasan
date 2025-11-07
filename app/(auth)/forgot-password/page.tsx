"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";

/**
 * Forgot Password Page
 * Allows users to request password reset via email (admin) or personal number (employee)
 */
export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!identifier.trim()) {
      setError("Bitte E-Mail oder Personalnummer eingeben.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Still show success message to prevent user enumeration
        setSuccess(true);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("[ForgotPassword] Error:", err);
      // Show success message even on error to prevent user enumeration
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-center mb-6">
          Anfrage übermittelt
        </h2>

        <div className="text-center space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Wenn ein Konto existiert, wurde eine Reset-Anfrage übermittelt.
              Bitte prüfe dein Postfach bzw. wende dich an das Büro.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Zurück zur Anmeldung</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        Passwort vergessen
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium mb-1.5">
            E-Mail oder Personalnummer
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="max@tetrasan.de oder 01234"
            disabled={isLoading}
            autoComplete="username"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Admins: E-Mail-Adresse eingeben. Mitarbeiter:innen: Personalnummer eingeben.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Wird gesendet...</span>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              <span>Link anfordern</span>
            </>
          )}
        </button>

        <div className="pt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück zur Anmeldung</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
