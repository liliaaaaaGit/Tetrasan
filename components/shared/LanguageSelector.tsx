"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
  size?: "sm" | "md";
}

export function LanguageSelector({ className, size = "md" }: LanguageSelectorProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.languageSwitcher");
  const [selected, setSelected] = useState<Locale>(locale);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedLocales = useMemo(() => SUPPORTED_LOCALES.map((code) => ({ code, label: LOCALE_LABELS[code] })), []);

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    setSelected(nextLocale);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/preferences/language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        window.location.reload();
      } catch (error) {
        console.error("[LanguageSelector] Failed to change language", error);
        setSelected(locale);
        setErrorMessage(t("error"));
      }
    });
  };

  const selectClass = cn(
    "rounded-md border border-border bg-white text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50",
    size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
    isPending && "opacity-75",
    className
  );

  return (
    <div className="flex flex-col items-stretch min-w-[140px]">
      <label className="sr-only" htmlFor="language-selector">
        {t("aria")}
      </label>
      <select
        id="language-selector"
        value={selected}
        className={selectClass}
        onChange={(event) => handleChange(event.target.value as Locale)}
        disabled={isPending}
      >
        {sortedLocales.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
      {errorMessage && (
        <span className={cn("mt-1 text-xs text-red-600", size === "sm" && "text-[0.7rem]")}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}

