"use client";

import { useState, useTransition } from "react";
import { Loader2, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateLanguageAction } from "@/app/actions/update-language";
import {
  languageToLocale,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from "@/lib/i18n/language";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  de: "Deutsch",
  sq: "Shqip",
  es: "Español",
  ro: "Română",
  "pt-pt": "Português (EU)",
  it: "Italiano",
  en: "English",
};

interface LanguageSwitcherProps {
  language: SupportedLanguage;
  onLanguageChange?: (language: SupportedLanguage) => void;
  className?: string;
}

export function LanguageSwitcher({
  language,
  onLanguageChange,
  className,
}: LanguageSwitcherProps) {
  const t = useTranslations("LanguageSwitcher");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value as SupportedLanguage;
    if (selected === language) return;

    setError(null);

    startTransition(async () => {
      try {
        await updateLanguageAction(selected);
        onLanguageChange?.(selected);
        document.documentElement.lang = languageToLocale(selected);
        router.refresh();
      } catch (err) {
        console.error("[LanguageSwitcher] update failed:", err);
        setError(t("error"));
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Languages className="h-4 w-4" />
        {t("label")}
      </label>
      <div className="relative">
        <select
          value={language}
          onChange={handleChange}
          disabled={isPending}
          className={cn(
            "appearance-none w-full min-w-[160px] px-3 py-2 text-sm border border-border rounded-lg bg-white pr-10",
            "focus:outline-none focus:ring-2 focus:ring-brand",
            isPending && "text-muted-foreground"
          )}
        >
          {SUPPORTED_LANGUAGES.map((value) => (
            <option key={value} value={value}>
              {LANGUAGE_LABELS[value]}
            </option>
          ))}
        </select>
        {isPending && (
          <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

