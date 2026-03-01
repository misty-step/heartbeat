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

/** Card surface - Field matte card, status communicated via background image */
const cardStyles =
  "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)] border border-[var(--color-border-default)] rounded-[var(--radius-xl)]";

/**
 * ZenStatusHero
 *
 * Full-viewport hero for status pages.
 * Visual differentiation per status via background image.
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

      {/* Content - UPPER LEFT */}
      <div className="relative z-10 h-full flex flex-col justify-start pt-16 sm:pt-24 px-6 sm:px-12 lg:px-24">
        <div className="relative max-w-md animate-km-fade-in">
          {/* Card */}
          <div className={cn("relative overflow-hidden", cardStyles)}>
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
