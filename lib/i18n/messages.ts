import de from "@/messages/de.json";
import sq from "@/messages/sq.json";
import es from "@/messages/es.json";
import ro from "@/messages/ro.json";
import ptpt from "@/messages/pt-pt.json";
import it from "@/messages/it.json";
import en from "@/messages/en.json";
import type { SupportedLanguage } from "@/lib/i18n/language";

export type TranslationMessages = typeof de;

export const messages: Record<SupportedLanguage, TranslationMessages> = {
  de,
  sq,
  es,
  ro,
  "pt-pt": ptpt,
  it,
  en,
};

