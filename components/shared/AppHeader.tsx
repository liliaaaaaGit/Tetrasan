"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TetrasanLogo } from "@/components/branding/TetrasanLogo";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import type { SupportedLanguage } from "@/lib/i18n/language";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface AppHeaderProps {
  navItems: NavItem[];
  logoSize?: "sm" | "md" | "lg" | "xl";
  backgroundColor?: string;
  language?: SupportedLanguage;
  onLanguageChange?: (language: SupportedLanguage) => void;
}

/**
 * Shared App Header Component
 * Reusable header with logo, navigation links, and logout button
 * Used by both employee and admin layouts
 */
export function AppHeader({
  navItems,
  logoSize = "xl",
  backgroundColor = "bg-white",
  language,
  onLanguageChange,
}: AppHeaderProps) {
  const pathname = usePathname();
  const tCommon = useTranslations("Common");

  return (
    <>
      {/* Desktop header */}
      <header className={cn(backgroundColor, "border-b border-border hidden md:block")}>
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div>
              <TetrasanLogo size={logoSize} />
            </div>
            
            {/* Navigation tabs with logout */}
            <nav className="flex flex-wrap gap-4 items-center justify-end">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href) || pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 py-3 px-4 transition-colors",
                      isActive
                        ? "bg-muted text-brand rounded-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {language && onLanguageChange && (
                <LanguageSwitcher
                  language={language}
                  onLanguageChange={onLanguageChange}
                />
              )}
              
              {/* Logout button */}
              <Link
                href="/logout"
                className="flex items-center gap-2 py-3 px-4 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">{tCommon("logout")}</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <div className={cn(backgroundColor, "md:hidden border-b border-border")}>
        <div className="px-4 py-4">
          {/* Logo */}
          <div className="mb-6">
            <TetrasanLogo size="lg" />
          </div>
          
          {/* Navigation tabs with logout */}
          <nav className="flex flex-col gap-3">
            {language && onLanguageChange && (
              <LanguageSwitcher
                language={language}
                onLanguageChange={onLanguageChange}
              />
            )}
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href) || pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-brand"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Logout button */}
            <Link
              href="/logout"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors self-end"
            >
              <LogOut className="h-4 w-4" />
              <span>{tCommon("logout")}</span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}

