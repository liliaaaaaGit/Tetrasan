"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { LogIn, Loader2 } from "lucide-react";
import { redirectByRole } from "@/lib/auth/redirects";

/**
 * LoginForm Component
 * Email + password login with Supabase Auth
 * Neutral error messages to prevent user enumeration
 */
export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const [identifier, setIdentifier] = useState(""); // email or 5-digit personal number
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic client-side validation
    if (!identifier || !password) {
      setError(t("errors.missing"));
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Resolve email if identifier is a 5-digit personal number
      let loginEmail = identifier.toLowerCase().trim();
      const pnrRegex = /^\d{5}$/;
      if (pnrRegex.test(identifier)) {
        const res = await fetch('/api/auth/resolve-pnr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personal_number: identifier })
        });
        const json = await res.json();
        loginEmail = json?.email || "";
      }

      // If still no email or invalid format, show neutral error
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginEmail)) {
        setError(t("errors.invalid"));
        setIsLoading(false);
        return;
      }

      // Attempt login with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError || !data.session) {
        // Neutral error - don't reveal whether email exists or password is wrong
        setError(t("errors.invalid"));
        setIsLoading(false);
        return;
      }

      // Success - get user profile to determine redirect
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .eq('active', true)
        .single();

      if (profileError || !profileData) {
        // Profile not found - redirect to employee dashboard as fallback
        router.push("/employee/hours");
        router.refresh();
        return;
      }

      // Redirect based on role
      const redirectPath = redirectByRole(profileData.role as "admin" | "employee");
      router.push(redirectPath);
      router.refresh();

    } catch (err) {
      console.error("[Login] Error:", err);
      setError(t("errors.generic"));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email or Personal number */}
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
          autoComplete="current-password"
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
            <LogIn className="h-4 w-4" />
            <span>{t("submit")}</span>
          </>
        )}
      </button>

      {/* Links */}
      <div className="space-y-2 text-sm text-center">
        <div>
          <Link href="/forgot-password" className="text-brand hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <div>
          <span className="text-muted-foreground">{t("noAccount")} </span>
          <Link href="/signup" className="text-brand hover:underline font-medium">
            {t("createAccount")}
          </Link>
        </div>
      </div>
    </form>
  );
}
