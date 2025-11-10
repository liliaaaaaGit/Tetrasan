"use server";

import { DEFAULT_LANGUAGE, isSupportedLanguage, SupportedLanguage } from "@/lib/i18n/language";
import { updateUserLanguage } from "@/lib/profile/updateLanguage";

export async function updateLanguageAction(language: SupportedLanguage): Promise<void> {
  const nextLanguage = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
  await updateUserLanguage(nextLanguage);
}

