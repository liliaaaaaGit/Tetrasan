"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Forgot Password Page
 * Allows users to request password reset via email (admin) or personal number (employee)
 */
export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgot");
  const tCommon = useTranslations("common");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!identifier.trim()) {
      setError(t("errors.missingIdentifier"));
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
          {t("successHeading")}
        </h2>

        <div className="text-center space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              {t("successBody")}
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{tCommon("backToLogin")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">
        {t("heading")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium mb-1.5">
            {t("identifierLabel")}
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={t("identifierPlaceholder")}
            disabled={isLoading}
            autoComplete="username"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("instructions")}
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
              <span>{t("loading")}</span>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              <span>{t("submit")}</span>
            </>
          )}
        </button>

        <div className="pt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{tCommon("backToLogin")}</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
