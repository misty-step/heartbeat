"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";
import { Settings } from "lucide-react";

export function DashboardNavbar() {
  return (
    <nav className="px-6 sm:px-12 lg:px-24 py-6 border-b border-foreground/10">
      <div className="flex items-center justify-between">
        {/* Logo / Wordmark */}
        <Link
          href="/dashboard"
          className="font-serif text-xl tracking-tight text-foreground hover:opacity-70 transition-opacity"
        >
          Heartbeat
        </Link>

        {/* Right side: Settings + Theme toggle + User menu */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors rounded-md"
            title="Notification Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <ThemeToggle />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonTrigger:
                  "focus:shadow-none focus:ring-2 focus:ring-foreground/20 rounded-full",
              },
            }}
          />
        </div>
      </div>
    </nav>
  );
}
