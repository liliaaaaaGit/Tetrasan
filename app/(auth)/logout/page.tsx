"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Logout Page
 * Signs out user from Supabase and shows confirmation
 */
export default function LogoutPage() {
  const t = useTranslations("auth.logout");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function signOut() {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
        setIsLoading(false);
      } catch (error) {
        console.error("[Logout] Error:", error);
        setIsLoading(false);
      }
    }

    signOut();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{t("heading")}</h2>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
      </div>
      <Link
        href="/login"
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
