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

    let abortController: AbortController | null = null;

    const fetchUnreadCount = async () => {
      // Cancel any pending request
      if (abortController) {
        abortController.abort();
      }
      
      // Create new abort controller for this request
      abortController = new AbortController();
      const signal = abortController.signal;

      try {
        // Use cache: 'no-store' to ensure we always get fresh data from DB
        // Removed timestamp query param to avoid issues during page reloads
        const response = await fetch('/api/inbox-events/unread-count', {
          cache: 'no-store',
          signal,
        });
        
        // Check if request was aborted
        if (signal.aborted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        } else {
          // Silently fail - don't break nav if count fails
          // Keep previous count to avoid flicker
        }
      } catch (error) {
        // Ignore AbortError (request cancelled) and network errors during reload
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            // Request was cancelled (e.g., during page reload) - silently ignore
            return;
          }
          // Check for network-related errors
          if (error.message.includes('network') || 
              error.message.includes('ERR_NETWORK') ||
              error.message.includes('Failed to fetch')) {
            // Network error during reload - silently ignore to avoid console spam
            return;
          }
        }
        // Only log unexpected errors
        console.error('Error fetching unread count:', error);
        // Don't reset to 0 on error - keep previous count to avoid flicker
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
      // Abort any pending request on cleanup
      if (abortController) {
        abortController.abort();
      }
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

