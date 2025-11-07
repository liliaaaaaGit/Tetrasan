"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      return "Bitte neues Passwort eingeben und bestätigen.";
    }

    if (newPassword !== confirmPassword) {
      return "Passwörter stimmen nicht überein.";
    }

    if (newPassword.length < 8) {
      return "Passwort muss mindestens 8 Zeichen lang sein.";
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      return "Passwort muss Buchstaben und Zahlen enthalten.";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Optionally verify current password before allowing change
      if (currentPassword) {
        const { data: userData } = await supabase.auth.getUser();
        const loginEmail = userData.user?.email;

        if (!loginEmail) {
          setError("Aktuelles Passwort kann nicht überprüft werden. Bitte ohne Überprüfung fortfahren.");
          setIsSubmitting(false);
          return;
        }

        const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: currentPassword,
        });

        if (verifyError || !verifyData.session) {
          setError("Aktuelles Passwort ist falsch.");
          setIsSubmitting(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError(updateError.message || "Passwort konnte nicht geändert werden.");
        return;
      }

      const apiResponse = await fetch("/api/employee/change-password", { method: "POST" });
      if (!apiResponse.ok) {
        console.warn("[ChangePassword] Konnte must_change_password nicht zurücksetzen.");
      }

      setSuccess("Passwort erfolgreich geändert.");
      setTimeout(() => {
        router.push("/employee/hours");
      }, 1200);
    } catch (error) {
      console.error("[ChangePassword] Fehler:", error);
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte später erneut versuchen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex items-center gap-2">
        <Lock className="h-5 w-5 text-brand" />
        <h1 className="text-xl font-semibold text-foreground">Passwort ändern</h1>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium">
              Aktuelles Passwort <span className="text-xs text-muted-foreground">(optional)</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nur ausfüllen, wenn Passwort bekannt"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium">
              Neues Passwort
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Mindestens 8 Zeichen"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Passwort wiederholen"
              required
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Tipp: Verwenden Sie ein starkes Passwort mit Buchstaben, Zahlen und Sonderzeichen.
          </p>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700" role="status">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Speichert...</span>
              </>
            ) : (
              <>Passwort speichern</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

