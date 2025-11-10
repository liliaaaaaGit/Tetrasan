import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import "./globals.css";

import { getMessagesWithFallback } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/get-request-locale";
import { toHtmlLang } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Tetrasan Zeiterfassung",
  description: "Zeiterfassung für Tetrasan Mitarbeiter",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = await getMessagesWithFallback(locale);

  return (
    <html lang={toHtmlLang(locale)} suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

