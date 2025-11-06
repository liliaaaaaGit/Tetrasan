"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Plane, Calendar, LogOut } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);

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

      {/* Mobile header with logo and navigation */}
      <div className="md:hidden bg-white border-b border-border">
        <div className="px-4 py-4">
          {/* Logo */}
          <div className="mb-6">
            <TetrasanLogo size="lg" />
          </div>
          
          {/* Navigation tabs with logout */}
          <nav className="flex gap-2 justify-end">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Abmelden</span>
            </Link>
          </nav>
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
