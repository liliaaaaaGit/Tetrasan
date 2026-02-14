"use client";

import { Users, Inbox, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/shared/AppHeader";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const tNav = useTranslations("nav.admin");
  const pathname = usePathname();

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

  // Fetch unread count for inbox badge
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        // Use cache: 'no-store' to ensure we always get fresh data from DB
        // Add timestamp query param as additional cache-busting
        const response = await fetch(`/api/inbox-events/unread-count?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        } else {
          // Silently fail - don't break nav if count fails
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Listen for custom event when inbox items are marked as read
    const handleInboxUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('inbox-updated', handleInboxUpdate);

    // Refresh count when navigating to/from inbox page
    // Also set up a periodic refresh (every 30 seconds) to catch updates
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('inbox-updated', handleInboxUpdate);
    };
  }, [user, pathname]);

  // Navigation items for admin
  const navItems = [
    {
      href: "/admin/employees",
      icon: Users,
      label: tNav("employees"),
    },
    {
      href: "/admin/inbox",
      icon: Inbox,
      label: tNav("inbox"),
      badgeCount: unreadCount,
    },
    {
      href: "/admin/password-resets",
      icon: Key,
      label: tNav("passwordResets"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with logo, navigation, and logout */}
      {user && <AppHeader navItems={navItems} logoSize="xl" backgroundColor="bg-muted/30" />}

      {/* Main content area */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}

