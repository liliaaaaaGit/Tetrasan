"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserPlus, Loader2, Info } from "lucide-react";

/**
 * SignupForm Component
 * Calls server-side signup endpoint with allow-list check
 * Neutral error messages to prevent user enumeration
 */
export function SignupForm() {
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const [personalNumber, setPersonalNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!personalNumber || !password || !passwordConfirm) {
      setError(t("errors.required"));
      setIsLoading(false);
      return;
    }

    // Personal number check
    if (!/^\d{5}$/.test(personalNumber)) {
      setError(t("errors.invalidPersonalNumber"));
      setIsLoading(false);
      return;
    }

    // Password length check
    if (password.length < 8) {
      setError(t("errors.shortPassword"));
      setIsLoading(false);
      return;
    }

    // Password match check
    if (password !== passwordConfirm) {
      setError(t("errors.mismatch"));
      setIsLoading(false);
      return;
    }

    try {
      // Call server-side signup endpoint
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personal_number: personalNumber,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Server returned error (neutral message)
        setError(data.error || t("errors.server"));
        setIsLoading(false);
        return;
      }

      // Success - redirect to login with message
      const successMessage = encodeURIComponent(t("successRedirect"));
      router.push(`/login?message=${successMessage}`);

    } catch (err) {
      console.error("[Signup] Error:", err);
      setError(t("errors.generic"));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info message */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            {t("info")}
          </p>
        </div>
      </div>

      {/* Personal number */}
      <div>
        <label htmlFor="pnr" className="block text-sm font-medium mb-1.5">
          {t("personalNumberLabel")}
        </label>
        <input
          id="pnr"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          value={personalNumber}
          onChange={(e) => setPersonalNumber(e.target.value.replace(/\D/g, ""))}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={t("personalNumberPlaceholder")}
          disabled={isLoading}
          autoComplete="off"
          title={t("personalNumberTitle")}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">
          {t("passwordLabel")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={t("passwordPlaceholder")}
          disabled={isLoading}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("passwordHint")}
        </p>
      </div>

      {/* Password Confirmation */}
      <div>
        <label htmlFor="password-confirm" className="block text-sm font-medium mb-1.5">
          {t("passwordConfirmLabel")}
        </label>
        <input
          id="password-confirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={t("passwordConfirmPlaceholder")}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Submit button */}
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
            <UserPlus className="h-4 w-4" />
            <span>{t("submit")}</span>
          </>
        )}
      </button>

      {/* Links */}
      <div className="text-sm text-center">
        <span className="text-muted-foreground">{t("hasAccount")} </span>
        <Link href="/login" className="text-brand hover:underline font-medium">
          {t("loginLink")}
        </Link>
      </div>
    </form>
  );
}
