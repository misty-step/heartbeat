"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { type MonitorStatus } from "@/lib/domain";

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
  up: "bg-gradient-to-br from-teal-400/20 to-cyan-500/15",
  degraded: "bg-gradient-to-br from-amber-400/25 to-orange-500/15",
  down: "bg-gradient-to-br from-red-500/30 to-rose-600/20",
};

/** Glass card surface - backdrop blur with status-tinted ring */
const glassStyles: Record<MonitorStatus, string> = {
  up: "bg-background/50 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-teal-400/20",
  degraded:
    "bg-background/50 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-amber-400/25",
  down: "bg-background/50 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-red-500/30",
};

/**
 * Full-viewport Zen hero for status pages.
 *
 * Visual differentiation per status:
 * - up: Serene deer drinking, neutral card
 * - degraded: Alert deer, storm clouds, amber border
 * - down: Thunder storm, fleeing deer, red border
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
        <div className="absolute inset-0 bg-background/30 dark:bg-background/40" />
      </div>

      {/* Content - UPPER LEFT with layered glass card */}
      <div className="relative z-10 h-full flex flex-col justify-start pt-16 sm:pt-24 px-6 sm:px-12 lg:px-24">
        <div className="relative max-w-md animate-zen-fade-in">
          {/* 1. Ambient Backlight - Colored glow behind card */}
          <div
            className={`absolute -inset-3 rounded-3xl blur-2xl ${ambientStyles[status]}`}
          />

          {/* 2. Glass Card */}
          <div
            className={`relative overflow-hidden rounded-2xl ${glassStyles[status]}`}
          >
            {/* 3. Top Edge Highlight - light catching glass edge */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {/* 4. Noise Texture Overlay - tactile glass feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay noise-texture" />

            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8">
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight">
                {monitorName}
              </h1>
              <p className="mt-3 text-foreground/70 text-base">
                {statusMessages[status]}
              </p>
            </div>
          </div>
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
