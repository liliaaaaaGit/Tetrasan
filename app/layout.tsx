import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tetrasan Zeiterfassung",
  description: "Zeiterfassung für Tetrasan Mitarbeiter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-DE">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

