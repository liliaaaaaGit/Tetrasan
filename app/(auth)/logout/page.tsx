"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";
import { TetrasanLogo } from "@/components/branding/TetrasanLogo";

/**
 * Logout Page
 * Signs out user from Supabase and shows confirmation
 */
export default function LogoutPage() {
  const router = useRouter();
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
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center">
        <div className="flex justify-center mb-8">
          <TetrasanLogo size="lg" />
        </div>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Abmelden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center">
      <div className="flex justify-center mb-8">
        <TetrasanLogo size="lg" />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-border p-6 md:p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-muted rounded-full">
            <LogOut className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-3">Du bist abgemeldet</h2>
        <p className="text-muted-foreground mb-6">
          Du hast dich erfolgreich abgemeldet.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium"
        >
          Zur Anmeldung
        </Link>
      </div>
      
      {/* Legal links */}
      <div className="mt-6 text-center text-xs text-muted-foreground space-x-4">
        <Link href="/datenschutz" className="hover:underline">
          Datenschutz
        </Link>
        <span>•</span>
        <Link href="/impressum" className="hover:underline">
          Impressum
        </Link>
      </div>
    </div>
  );
}
