"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavReveal } from "./AnimateOnView";

/**
 * Landing page navigation bar.
 * Client component: uses ThemeToggle (useTheme) and NavReveal (framer-motion).
 */
export function Navigation() {
  return (
    <NavReveal className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        <div className="size-2.5 rounded-full bg-accent" />
        <span className="font-display text-lg tracking-tight text-foreground">
          Heartbeat
        </span>
      </Link>

      {/* Right side: links + toggle + sign-in button */}
      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#pricing"
            className="font-body text-sm text-secondary transition-colors hover:text-accent"
          >
            Pricing
          </a>
          <a
            href="#features"
            className="font-body text-sm text-secondary transition-colors hover:text-accent"
          >
            Features
          </a>
        </div>
        <ThemeToggle />
        <Link
          href="/sign-in"
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-full border border-[var(--color-border-default)] px-5",
            "font-body text-sm text-secondary transition-all",
            "hover:bg-[var(--color-bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          )}
        >
          Sign in
        </Link>
      </div>
    </NavReveal>
  );
}
