import { DEFAULT_LANGUAGE, isSupportedLanguage, SupportedLanguage } from "@/lib/i18n/language";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function updateUserLanguage(language: SupportedLanguage): Promise<void> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Nicht authentifiziert.");
  }

  const nextLanguage = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ language: nextLanguage })
    .eq("id", session.user.id)
    .eq("active", true);

  if (error) {
    console.error("[updateUserLanguage] Fehler beim Aktualisieren der Sprache:", error.message);
    throw new Error("Die bevorzugte Sprache konnte nicht gespeichert werden.");
  }
}

