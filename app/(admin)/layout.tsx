"use client";

import { Users, Inbox, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/shared/AppHeader";
import { useTranslations } from "next-intl";
import {
  DEFAULT_LANGUAGE,
  languageToLocale,
  resolveLanguage,
  type SupportedLanguage,
} from "@/lib/i18n/language";

/**
 * Admin Layout
 * Features a top header navigation (same style as employee layout)
 * Two main sections: Employees and Inbox
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const tAdminNav = useTranslations("AdminNav");

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const supabase = createClient();

    supabase
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("[AdminLayout] Fehler beim Laden der Sprache:", error.message);
          return;
        }

        const resolvedLanguage = resolveLanguage(data);
        setLanguage(resolvedLanguage);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    document.documentElement.lang = languageToLocale(language);
  }, [language]);

  // Navigation items for admin
  const navItems = [
    {
      href: "/admin/employees",
      icon: Users,
      label: tAdminNav("employees"),
    },
    {
      href: "/admin/inbox",
      icon: Inbox,
      label: tAdminNav("inbox"),
    },
    {
      href: "/admin/password-resets",
      icon: Key,
      label: tAdminNav("passwordResets"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with logo, navigation, and logout */}
      {user && (
        <AppHeader
          navItems={navItems}
          logoSize="xl"
          backgroundColor="bg-muted/30"
          language={language}
          onLanguageChange={(lang) => setLanguage(lang)}
        />
      )}

      {/* Main content area */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}

