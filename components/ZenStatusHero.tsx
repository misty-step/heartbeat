"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { type MonitorStatus } from "@/lib/domain";
import { cn } from "@/lib/cn";

interface ZenStatusHeroProps {
  status: MonitorStatus;
  monitorName: string;
}

/** Status-specific background images */
const heroImages: Record<MonitorStatus, string> = {
  up: "/images/deer-01.webp",
  degraded: "/images/deer-alert-01.webp",
  down: "/images/deer-thunder-01.webp",
};

/** Status messages with distinct copy per state */
const statusMessages: Record<MonitorStatus, string> = {
  up: "All systems operational",
  degraded: "Performance degradation detected",
  down: "Service outage in progress",
};

/** Ambient backlight - soft colored glow behind card */
const ambientStyles: Record<MonitorStatus, string> = {
  up: "bg-up-muted",
  degraded: "bg-degraded-muted",
  down: "bg-down-muted",
};

/** Card surface - solid background with status-tinted border */
const glassStyles: Record<MonitorStatus, string> = {
  up: "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)] border-2 border-[var(--color-status-up)]",
  degraded:
    "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)] border-2 border-[var(--color-status-degraded)]",
  down: "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)] border-2 border-[var(--color-status-down)]",
};

/**
 * ZenStatusHero
 *
 * Full-viewport hero for status pages.
 * Visual differentiation per status via background image and border color.
 */
export function ZenStatusHero({ status, monitorName }: ZenStatusHeroProps) {
  const handleScrollToDetails = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <header className="h-dvh relative overflow-hidden">
      {/* Full-bleed background image - changes per status */}
      <div className="absolute inset-0">
        <Image
          src={heroImages[status]}
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Lighter overlay — let image shine */}
        <div className="absolute inset-0 bg-[var(--color-bg-primary)]/30 dark:bg-[var(--color-bg-primary)]/40" />
      </div>

      {/* Content - UPPER LEFT with layered glass card */}
      <div className="relative z-10 h-full flex flex-col justify-start pt-16 sm:pt-24 px-6 sm:px-12 lg:px-24">
        <div className="relative max-w-md animate-km-fade-in">
          {/* 1. Ambient Backlight - Status-colored glow behind card (increased visibility) */}
          <div
            className={cn(
              "absolute -inset-3 rounded-3xl blur-2xl opacity-80",
              ambientStyles[status],
            )}
          />

          {/* 2. Glass Card */}
          <div
            className={cn(
              "relative overflow-hidden rounded-[var(--radius-xl)]",
              glassStyles[status],
            )}
          >
            {/* 3. Top Edge Highlight - visible light catching glass edge */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--color-text-primary)] text-balance tracking-tight">
                {monitorName}
              </h1>
              <p className="mt-3 text-[var(--color-text-secondary)] text-base text-pretty">
                {statusMessages[status]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint - centered at bottom */}
      <button
        onClick={handleScrollToDetails}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors animate-km-hint z-10"
        aria-label="Scroll to details"
      >
        <span className="text-xs tracking-wider uppercase">Details</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </header>
  );
}
