"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { type MonitorStatus } from "@/lib/domain";

interface ZenStatusHeroProps {
  status: MonitorStatus;
  monitorName: string;
}

const statusMessages: Record<MonitorStatus, string> = {
  up: "All systems operational",
  degraded: "Experiencing issues",
  down: "Service disruption",
};

/**
 * Full-viewport Zen hero for status pages.
 *
 * Philosophy: The absence of noise IS the message.
 * Breathing dot + name as unified element, status subheading below.
 */
export function ZenStatusHero({ status, monitorName }: ZenStatusHeroProps) {
  const handleScrollToDetails = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <header className="h-screen relative overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/deer-01.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Lighter overlay — let image shine */}
        <div className="absolute inset-0 bg-background/30 dark:bg-background/40" />
      </div>

      {/* Content - UPPER LEFT with frosted card */}
      <div className="relative z-10 h-full flex flex-col justify-start pt-16 sm:pt-24 px-6 sm:px-12 lg:px-24">
        <div className="max-w-md backdrop-blur-md bg-background/60 dark:bg-background/70 rounded-2xl p-6 sm:p-8 shadow-lg animate-zen-fade-in">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight">
            {monitorName}
          </h1>
          <p className="mt-3 text-foreground/70 text-base">
            {statusMessages[status]}
          </p>
        </div>
      </div>

      {/* Scroll hint - centered at bottom */}
      <button
        onClick={handleScrollToDetails}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground/40 hover:text-foreground/60 transition-colors animate-zen-hint z-10"
        aria-label="Scroll to details"
      >
        <span className="text-xs tracking-wider uppercase">Details</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </header>
  );
}
