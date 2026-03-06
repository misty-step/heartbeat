"use client";

import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Icon } from "@phosphor-icons/react";
import { Heartbeat, Tag, SignIn } from "@phosphor-icons/react";

function NavLink({
  href,
  icon: IconComponent,
  children,
}: {
  href: string;
  icon: Icon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
    >
      <IconComponent className="size-4" />
      <span>{children}</span>
    </Link>
  );
}

function IsItDownNav() {
  return (
    <nav className="page-container relative z-50 flex items-center justify-between gap-8 py-5">
      <Link href="/" className="flex shrink-0 items-center gap-3">
        <span className="size-2.5 rounded-full bg-accent" />
        <span className="font-display text-lg tracking-tight text-foreground">
          Heartbeat
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <div className="hidden items-center gap-1 sm:flex">
          <NavLink href="/is-it-down" icon={Heartbeat}>
            Is It Down
          </NavLink>
          <NavLink href="/pricing" icon={Tag}>
            Pricing
          </NavLink>
        </div>
        <ThemeToggle />
        <Link
          href="/sign-in"
          className="ml-2 inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border-default)] px-5 text-sm text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <SignIn className="size-4" />
          Sign in
        </Link>
      </div>
    </nav>
  );
}

export default function IsItDownLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <IsItDownNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
