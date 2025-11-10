"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { TetrasanLogo } from "@/components/branding/TetrasanLogo";
import { LanguageSelector } from "@/components/shared/LanguageSelector";

/**
 * Auth Layout
 * Minimal, centered form container for login/signup pages
 * Neutral background with link back to home
 * Wider layout for legal pages (datenschutz, impressum)
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const tCommon = useTranslations("common");
  const isLegalPage = pathname === "/datenschutz" || pathname === "/impressum";
  const maxWidth = isLegalPage ? "max-w-4xl" : "max-w-md";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header with back link */}
      <header className="p-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{tCommon("back")}</span>
        </Link>
        <div className="min-w-[140px]">
          <LanguageSelector size="sm" />
        </div>
      </header>

      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className={`w-full ${maxWidth}`}>
          {/* Logo/Brand - hide on legal pages */}
          {!isLegalPage && (
            <div className="flex justify-center mb-8">
              <TetrasanLogo size="lg" />
            </div>
          )}

          {/* Form card */}
          <div className="bg-white rounded-lg shadow-sm border border-border p-6 md:p-8">
            {children}
          </div>

          {/* Legal links */}
          <div className="mt-6 text-center text-xs text-muted-foreground space-x-4">
            <Link href="/datenschutz" className="hover:underline">
              {tCommon("legal.privacy")}
            </Link>
            <span>•</span>
            <Link href="/impressum" className="hover:underline">
              {tCommon("legal.imprint")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

