export const SUPPORTED_LOCALES = [
  "de",
  "sq",
  "es",
  "ro",
  "pt-pt",
  "it",
  "en",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_COOKIE = "tetrasan.locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  sq: "Shqip",
  es: "Español",
  ro: "Română",
  "pt-pt": "Português",
  it: "Italiano",
  en: "English",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

export function toHtmlLang(locale: Locale): string {
  const [language, region] = locale.split("-");
  if (!region) {
    return language;
  }
  return `${language}-${region.toUpperCase()}`;
}

