import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, type Locale, isLocale } from "@/i18n/config";

interface UpdateLanguageBody {
  locale?: string;
}

export async function POST(request: NextRequest) {
  let locale: Locale | null = null;

  try {
    const body = (await request.json()) as UpdateLanguageBody;
    if (!body?.locale || !isLocale(body.locale)) {
      return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
    }

    locale = body.locale;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          preferred_language: locale,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.warn("[language] Failed to store preferred_language:", updateError.message);
      }
    }

    const response = NextResponse.json({ success: true, locale });
    response.cookies.set({
      name: LOCALE_COOKIE,
      value: locale,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[language] Unexpected error updating locale:", error);
    return NextResponse.json(
      { error: "Unable to update language preference." },
      { status: 500 }
    );
  }
}

