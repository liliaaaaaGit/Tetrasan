import { cookies, headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from "./config";

function parseAcceptLanguage(): Locale | null {
  const acceptLanguageHeader = headers().get("accept-language");
  if (!acceptLanguageHeader) {
    return null;
  }

  const accepted = acceptLanguageHeader
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase());

  for (const locale of accepted) {
    if (isLocale(locale)) {
      return locale;
    }

    // Handle language-only header values (e.g., "pt" matching "pt-pt")
    const normalized = SUPPORTED_LOCALES.find((supported) =>
      supported.startsWith(`${locale}-`) || supported === locale
    );
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = cookies();
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!error) {
        const preferred = data?.preferred_language;
        if (isLocale(preferred)) {
          // Always honour the user-specific preference.
          return preferred;
        }
      } else {
        console.warn("[i18n] Failed to load profile language:", error.message);
      }
    }
  } catch (error) {
    console.warn("[i18n] Falling back to default locale:", error);
  }

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const browserLocale = parseAcceptLanguage();
  if (browserLocale) {
    return browserLocale;
  }

  return DEFAULT_LOCALE;
}

