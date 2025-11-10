export type SupportedLanguage = "de" | "sq" | "es" | "ro" | "pt-pt" | "it" | "en";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "de",
  "sq",
  "es",
  "ro",
  "pt-pt",
  "it",
  "en",
];

export const DEFAULT_LANGUAGE: SupportedLanguage = "de";

const LANGUAGE_TO_LOCALE_MAP: Record<SupportedLanguage, string> = {
  de: "de-DE",
  sq: "sq",
  es: "es-ES",
  ro: "ro-RO",
  "pt-pt": "pt-PT",
  it: "it-IT",
  en: "en-US",
};

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

type ProfileLike = {
  language?: string | null;
} | null | undefined;

export function resolveLanguage(
  profile?: { language?: string | null } | null | undefined
): SupportedLanguage {
  const candidate =
    profile && typeof profile === "object" ? profile.language ?? DEFAULT_LANGUAGE : DEFAULT_LANGUAGE;
  return isSupportedLanguage(candidate) ? candidate : DEFAULT_LANGUAGE;
}

export function languageToLocale(language: SupportedLanguage): string {
  return LANGUAGE_TO_LOCALE_MAP[language] ?? LANGUAGE_TO_LOCALE_MAP[DEFAULT_LANGUAGE];
}

