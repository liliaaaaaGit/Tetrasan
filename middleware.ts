import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
// Avoid helpers that call redirect() server-side here
// We'll read the profile directly to prevent redirect loops

/**
 * Middleware for route protection and session management
 * 
 * Protected routes:
 * - (employee)/* - Requires authenticated session
 * - (admin)/* - Requires authenticated session with admin role
 * 
 * Public routes:
 * - (auth)/* - Login, signup, etc.
 * - / - Landing page
 */

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Refresh session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;
  const isDev = process.env.NODE_ENV !== "production";

  const isAuthRoute = path === "/login" || path === "/signup";
  const isEmployeeRoute = path.startsWith("/employee");
  const isAdminRoute = path.startsWith("/admin");

  // Extract role from JWT (avoid DB calls in middleware to prevent 406s)
  type JwtRole = string | undefined;
  const jwtRole: JwtRole = session?.user?.app_metadata?.role
    || (session?.user as any)?.user_metadata?.role
    || undefined;
  // We don't have 'active' in JWT; assume active when session exists
  const profile = session
    ? { id: session.user.id, role: jwtRole || "employee", active: true }
    : null;

  if (isDev) {
    console.log("[middleware]", {
      path,
      hasSession: !!session,
      role: profile?.role,
      active: profile?.active,
    });
  }

  // 1) Auth routes: allow access for unauthenticated users; if authenticated with a valid profile, redirect once
  if (isAuthRoute) {
    if (!session) {
      if (isDev) console.log("[middleware] allow /auth (no session)");
      return response; // allow login/signup
    }

    // session exists; redirect ONLY if profile is valid
    if (profile && profile.active) {
      const redirectPath = jwtRole === "admin" ? "/admin/employees" : "/employee/hours";
      if (isDev) console.log("[middleware] redirect auth ->", redirectPath);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Profile missing/invalid: stay on auth page (do not sign out, avoid loops)
    if (isDev) console.log("[middleware] allow /auth (invalid/missing profile)");
    return response;
  }

  // 2) Unauthenticated access to protected areas -> login
  if (!session && (isEmployeeRoute || isAdminRoute)) {
    if (isDev) console.log("[middleware] redirect -> /login (no session)");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated but profile invalid/inactive on protected pages -> send to /login (no signOut to avoid loops)
  if ((isEmployeeRoute || isAdminRoute) && session && (!profile || !profile.active)) {
    if (isDev) console.log("[middleware] redirect -> /login (invalid/missing profile)");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3) Role gates (only if authenticated and profile is valid)
  if (session && profile) {
    // Admin section requires admin
    // If JWT role is explicitly present and not admin, redirect away.
    // If role is missing in JWT, allow and let server-side checks handle it.
    if (isAdminRoute && jwtRole !== undefined && jwtRole !== "admin") {
      if (isDev) console.log("[middleware] redirect -> /employee/hours (not admin)");
      return NextResponse.redirect(new URL("/employee/hours", request.url));
    }

    // Employee section allows employee or admin (admins can view employee pages)
    // No redirect necessary here unless user has some other role
    if (isEmployeeRoute && !["employee", "admin"].includes(profile.role)) {
      if (isDev) console.log("[middleware] redirect -> /login (invalid role for employee routes)");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 4) Public and any other routes: fall through

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

