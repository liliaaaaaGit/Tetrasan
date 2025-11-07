"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Plane, Calendar, LogOut, Menu, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { TetrasanLogo } from "@/components/branding/TetrasanLogo";

/**
 * Employee Layout
 * Features a mobile-first bottom navigation with three tabs:
 * - Stunden (Hours): Time tracking
 * - Urlaub (Leave): Vacation requests
 * - Tagesbefreiung (Day Off): Day-off requests
 */
export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

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
      .from('profiles')
      .select('must_change_password')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('[EmployeeLayout] Fehler beim Laden von must_change_password:', error.message);
          return;
        }

        const shouldForce = !!data?.must_change_password;
        setMustChangePassword(shouldForce);

        if (shouldForce && pathname !== '/employee/change-password') {
          router.replace('/employee/change-password');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, pathname, router]);

  // Navigation items for the bottom tab bar
  const navItems = [
    {
      href: "/employee/hours",
      icon: Clock,
      label: "Stunden",
    },
    {
      href: "/employee/leave",
      icon: Plane,
      label: "Urlaub",
    },
    {
      href: "/employee/dayoff",
      icon: Calendar,
      label: "Tagesbefreiung",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop header with logo, navigation, and auth status */}
      {user && (
        <header className="bg-white border-b border-border hidden md:block">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            {/* Logo */}
            <div className="mb-6">
              <TetrasanLogo size="xl" />
            </div>
            
            {/* Navigation tabs with logout */}
            <nav className="flex gap-6 justify-end">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
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
              
              {/* Logout button */}
              <Link
                href="/employee/change-password"
                className={cn(
                  "flex items-center gap-2 py-3 px-4 transition-colors",
                  pathname === '/employee/change-password'
                    ? "bg-muted text-brand rounded-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                )}
              >
                <Lock className="h-5 w-5" />
                <span className="text-sm font-medium">Passwort ändern</span>
              </Link>
              <Link
                href="/logout"
                className="flex items-center gap-2 py-3 px-4 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Abmelden</span>
              </Link>
            </nav>
          </div>
        </header>
      )}

      {/* Mobile header with hamburger menu */}
      <div className="md:hidden bg-white border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <TetrasanLogo size="lg" />
            <button
              aria-label="Menü öffnen"
              aria-haspopup="menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile menu panel */}
          {isMobileMenuOpen && (
            <div
              role="menu"
              aria-label="Navigation"
              className="mt-3 rounded-lg border border-border bg-white shadow-md divide-y"
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors",
                      isActive ? "bg-muted text-brand" : "hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/employee/change-password"
                role="menuitem"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  pathname === '/employee/change-password' ? "bg-muted text-brand" : "hover:bg-muted/50"
                )}
              >
                <Lock className="h-5 w-5" />
                <span className="font-medium">Passwort ändern</span>
              </Link>
              <Link
                href="/logout"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Abmelden</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  );
}
