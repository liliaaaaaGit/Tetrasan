"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ChangePasswordPage() {
  const router = useRouter();
  const t = useTranslations("changePassword");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      return t("errors.missingNew");
    }

    if (newPassword !== confirmPassword) {
      return t("errors.mismatch");
    }

    if (newPassword.length < 8) {
      return t("errors.minLength");
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      return t("errors.requirements");
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
          setError(t("errors.verifyMissingEmail"));
          setIsSubmitting(false);
          return;
        }

        const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: currentPassword,
        });

        if (verifyError || !verifyData.session) {
          setError(t("errors.verifyFailed"));
          setIsSubmitting(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError(updateError.message || t("errors.updateFailed"));
        return;
      }

      const apiResponse = await fetch("/api/employee/change-password", { method: "POST" });
      if (!apiResponse.ok) {
        console.warn("[ChangePassword] Failed to reset must_change_password flag.");
      }

      setSuccess(t("success"));
      setTimeout(() => {
        router.push("/employee/hours");
      }, 1200);
    } catch (error) {
      console.error("[ChangePassword] Fehler:", error);
      setError(t("errors.unexpected"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex items-center gap-2">
        <Lock className="h-5 w-5 text-brand" />
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium">
              {t("currentLabel")} <span className="text-xs text-muted-foreground">({t("optional")})</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("currentPlaceholder")}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium">
              {t("newLabel")}
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("newPlaceholder")}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
              {t("confirmLabel")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("confirmPlaceholder")}
              required
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t("tip")}
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
                <span>{t("saving")}</span>
              </>
            ) : (
              <>{t("button")}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

