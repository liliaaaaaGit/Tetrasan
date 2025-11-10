import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tetrasan Zeiterfassung",
  description: "Zeiterfassung für Tetrasan Mitarbeiter",
};

import { NextIntlClientProvider } from "next-intl";
import { getProfile, getSession } from "@/lib/auth/session";
import { DEFAULT_LANGUAGE, languageToLocale, resolveLanguage } from "@/lib/i18n/language";
import { messages } from "@/lib/i18n/messages";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let language = DEFAULT_LANGUAGE;

  try {
    const session = await getSession();
    const profile = session?.user ? await getProfile(session.user.id) : null;
    language = resolveLanguage(profile);
  } catch (error) {
    console.error("[RootLayout] Failed to resolve language, falling back to default:", error);
  }

  const locale = languageToLocale(language);
  const localeMessages = messages[language] ?? messages[DEFAULT_LANGUAGE];

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider locale={language} messages={localeMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

