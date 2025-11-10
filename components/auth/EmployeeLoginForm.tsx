"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { LogIn, Loader2 } from "lucide-react";

/**
 * EmployeeLoginForm
 * Personalnummer + Passwort → look up profile → sign in with internal email
 */
export function EmployeeLoginForm() {
  const router = useRouter();
  const t = useTranslations("auth.employeeLogin");
  const [personalNumber, setPersonalNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!/^\d{5}$/.test(personalNumber)) {
      setError(t("errors.invalidPersonalNumber"));
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError(t("errors.missingPassword"));
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Resolve internal email from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, role, active")
        .eq("personal_number", personalNumber)
        .eq("role", "employee")
        .eq("active", true)
        .maybeSingle();

      if (profileError || !profile) {
        setError(t("errors.invalidCredentials"));
        setIsLoading(false);
        return;
      }

      const internalEmail = profile.email; // stored when employee created

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });

      if (signInError || !data.session) {
        setError(t("errors.invalidCredentials"));
        setIsLoading(false);
        return;
      }

      // Redirect employee to hours
      router.push("/employee/hours");
    } catch (err) {
      console.error("[EmployeeLogin]", err);
      setError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="pnr" className="block text-sm font-medium mb-1.5">{t("personalNumberLabel")}</label>
        <input
          id="pnr"
          type="text"
          inputMode="numeric"
          pattern="\\d*"
          maxLength={5}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={t("personalNumberPlaceholder")}
          value={personalNumber}
          onChange={(e) => setPersonalNumber(e.target.value.replace(/\D/g, ""))}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">{t("passwordLabel")}</label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={t("passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        <span>{t("submit")}</span>
      </button>

      <div className="text-sm text-center">
        <span className="text-muted-foreground">{t("adminHint")} </span>
        <Link href="/login" className="text-brand hover:underline font-medium">{t("adminLink")}</Link>
      </div>
    </form>
  );
}


