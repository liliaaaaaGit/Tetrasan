import { DEFAULT_LOCALE, type Locale } from "./config";

export type Messages = Record<string, unknown>;

export async function getMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "de":
      return (await import("./messages/de.json")).default;
    case "sq":
      return (await import("./messages/sq.json")).default;
    case "es":
      return (await import("./messages/es.json")).default;
    case "ro":
      return (await import("./messages/ro.json")).default;
    case "pt-pt":
      return (await import("./messages/pt-pt.json")).default;
    case "it":
      return (await import("./messages/it.json")).default;
    case "en":
      return (await import("./messages/en.json")).default;
    default:
      return (await import("./messages/de.json")).default;
  }
}

export async function getMessagesWithFallback(locale: Locale): Promise<Messages> {
  try {
    return await getMessages(locale);
  } catch (error) {
    console.error("[i18n] Failed to load messages for locale:", locale, error);
    return getMessages(DEFAULT_LOCALE);
  }
}

