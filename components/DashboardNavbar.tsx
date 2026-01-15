"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";
import { Settings } from "lucide-react";

/**
 * DashboardNavbar - Kyoto Moss Design System
 *
 * Navigation bar for the dashboard with logo, settings, theme toggle, and user menu.
 */
export function DashboardNavbar() {
  return (
    <nav className="px-6 sm:px-12 lg:px-24 py-6 border-b border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between">
        {/* Logo / Wordmark */}
        <Link
          href="/dashboard"
          className="font-display text-xl tracking-tight text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
        >
          Heartbeat
        </Link>

        {/* Right side: Settings + Theme toggle + User menu */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded-[var(--radius-md)]"
            title="Notification Settings"
          >
            <Settings className="size-5" />
          </Link>
          <ThemeToggle />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "size-8",
                userButtonTrigger:
                  "focus:shadow-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20 rounded-full",
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}
