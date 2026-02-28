"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Footer } from "@/components/Footer";
import {
  BentoGridCard,
  StoneGardenCard,
  KintsugiLedgerCard,
  TempleRippleCard,
  ShojiLayerCard,
  ZenolithCard,
  MIXED_STATE_MONITORS,
} from "@/components/landing/StatusDisplayVariants";

/**
 * Design Lab - Card Layout Variations
 *
 * Field Design System explorations:
 * 1. Bento Grid - Asymmetric dashboard (down-the-middle)
 * 2. Stone Garden - Karesansui, monitors as stones
 * 3. Kintsugi Ledger - Editorial, gold incident lines
 * 4. Temple Ripple - Concentric status rings
 * 5. Shoji Layer - Frosted glass, depth
 * 6. Zenolith - Monolithic stone, tactile
 */

type Variation = "1" | "2" | "3" | "4" | "5" | "6";

const VARIATIONS: Record<Variation, { name: string; desc: string }> = {
  "1": { name: "Bento Grid", desc: "Asymmetric dashboard layout" },
  "2": { name: "Stone Garden", desc: "Karesansui, monitors as stones" },
  "3": { name: "Kintsugi", desc: "Editorial + gold incident lines" },
  "4": { name: "Temple Ripple", desc: "Concentric status rings" },
  "5": { name: "Shoji Layer", desc: "Frosted glass depth" },
  "6": { name: "Zenolith", desc: "Monolithic stone texture" },
};

export default function DesignLabPage() {
  const [variation, setVariation] = useState<Variation>("1");

  return (
    <div className="min-h-dvh bg-[var(--color-bg-primary)]">
      {/* Variation Selector */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-bg-primary)]/95 backdrop-blur-sm border-b border-[var(--color-border-subtle)]"
        role="navigation"
        aria-label="Design variations"
      >
        <div className="max-w-[90rem] mx-auto px-6 py-4 flex items-center gap-6 overflow-x-auto">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-muted)] shrink-0">
            Design Lab
          </span>
          <div className="flex gap-2" role="tablist">
            {(Object.keys(VARIATIONS) as Variation[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={variation === v}
                onClick={() => setVariation(v)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-primary)]",
                  variation === v
                    ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]",
                )}
              >
                {v}: {VARIATIONS[v].name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content panels */}
      <main className="pt-16">
        {variation === "1" && <VariationBentoGrid />}
        {variation === "2" && <VariationStoneGarden />}
        {variation === "3" && <VariationKintsugi />}
        {variation === "4" && <VariationTempleRipple />}
        {variation === "5" && <VariationShojiLayer />}
        {variation === "6" && <VariationZenolith />}
      </main>
    </div>
  );
}

// ============================================================================
// Shared: Grain Texture Overlay
// ============================================================================
function GrainOverlay() {
  return (
    <>
      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-overlay"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, var(--color-bg-primary) 100%)`,
        }}
      />
    </>
  );
}

// ============================================================================
// Shared: Hero content (left side)
// ============================================================================
function HeroContent() {
  return (
    <div className="text-center lg:text-left lg:flex-[1_1_auto]">
      <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl leading-[0.9] text-[var(--color-text-primary)] tracking-tight">
        Heartbeat
      </h1>
      <p className="mt-6 text-xl sm:text-2xl text-[var(--color-text-secondary)] text-pretty">
        Uptime monitoring that simply works.
      </p>
      <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
        <Link
          href="/sign-up"
          className="inline-flex px-8 py-4 bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] font-medium hover:bg-[var(--color-accent-primary-hover)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-primary)]"
        >
          Start Free
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// Variation 1: Bento Grid
// Asymmetric dashboard layout - the baseline
// ============================================================================
function VariationBentoGrid() {
  return (
    <div className="min-h-dvh">
      <section className="min-h-dvh relative overflow-hidden">
        <GrainOverlay />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-text-primary) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />

        <div className="relative min-h-dvh flex flex-col lg:flex-row items-center lg:justify-between px-8 sm:px-16 lg:px-24 py-24 gap-16 lg:gap-12 max-w-[90rem] mx-auto">
          <HeroContent />

          {/* Right: Bento Grid Card */}
          <div className="hidden lg:block shrink-0 w-[32rem]">
            <BentoGridCard monitors={MIXED_STATE_MONITORS} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ============================================================================
// Variation 2: Stone Garden
// Karesansui - monitors as stones in raked gravel
// ============================================================================
function VariationStoneGarden() {
  return (
    <div className="min-h-dvh">
      <section className="min-h-dvh relative overflow-hidden">
        <GrainOverlay />

        {/* Karesansui horizontal lines */}
        <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-[var(--color-text-primary)]"
              style={{ top: `${(i + 1) * 2.5}%` }}
            />
          ))}
        </div>

        <div className="relative min-h-dvh flex flex-col lg:flex-row items-center lg:justify-between px-8 sm:px-16 lg:px-24 py-24 gap-16 lg:gap-12 max-w-[90rem] mx-auto">
          <HeroContent />

          {/* Right: Stone Garden Card */}
          <div className="hidden lg:block shrink-0 w-[28rem]">
            <StoneGardenCard monitors={MIXED_STATE_MONITORS} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ============================================================================
// Variation 3: Kintsugi Ledger
// Editorial typography + gold accents for incidents
// ============================================================================
function VariationKintsugi() {
  return (
    <div className="min-h-dvh">
      <section className="min-h-dvh relative overflow-hidden">
        <GrainOverlay />

        {/* Subtle horizontal rules at edges */}
        <div
          className="absolute inset-x-0 top-32 h-px bg-[var(--color-border-subtle)]/30"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-32 h-px bg-[var(--color-border-subtle)]/30"
          aria-hidden="true"
        />

        <div className="relative min-h-dvh flex flex-col lg:flex-row items-center lg:justify-between px-8 sm:px-16 lg:px-24 py-24 gap-16 lg:gap-12 max-w-[90rem] mx-auto">
          <HeroContent />

          {/* Right: Kintsugi Ledger Card */}
          <div className="hidden lg:block shrink-0 w-[24rem]">
            <KintsugiLedgerCard monitors={MIXED_STATE_MONITORS} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ============================================================================
// Variation 4: Temple Ripple
// Concentric circles radiating from center
// ============================================================================
function VariationTempleRipple() {
  return (
    <div className="min-h-dvh">
      <section className="min-h-dvh relative overflow-hidden">
        <GrainOverlay />

        {/* Concentric circles background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="ripple-circles"
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle
                cx="100"
                cy="100"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle
                cx="100"
                cy="100"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ripple-circles)" />
        </svg>

        <div className="relative min-h-dvh flex flex-col lg:flex-row items-center lg:justify-between px-8 sm:px-16 lg:px-24 py-24 gap-16 lg:gap-12 max-w-[90rem] mx-auto">
          <HeroContent />

          {/* Right: Temple Ripple Card */}
          <div className="hidden lg:block shrink-0 w-[24rem]">
            <TempleRippleCard monitors={MIXED_STATE_MONITORS} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ============================================================================
// Variation 5: Shoji Layer
// Frosted glass, depth, professional
// ============================================================================
function VariationShojiLayer() {
  return (
    <div className="min-h-dvh">
      <section className="min-h-dvh relative overflow-hidden">
        <GrainOverlay />

        {/* Soft grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />

        <div className="relative min-h-dvh flex flex-col lg:flex-row items-center lg:justify-between px-8 sm:px-16 lg:px-24 py-24 gap-16 lg:gap-12 max-w-[90rem] mx-auto">
          <HeroContent />

          {/* Right: Shoji Layer Card */}
          <div className="hidden lg:block shrink-0 w-[28rem]">
            <ShojiLayerCard monitors={MIXED_STATE_MONITORS} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ============================================================================
// Variation 6: Zenolith
// Monolithic stone block, tactile and grounded
// ============================================================================
function VariationZenolith() {
  return (
    <div className="min-h-dvh">
      <section className="min-h-dvh relative overflow-hidden">
        {/* Film grain - heavier for this variant */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Heavy vignette */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse at center, transparent 20%, var(--color-bg-primary) 80%)`,
          }}
        />

        <div className="relative min-h-dvh flex flex-col lg:flex-row items-center lg:justify-between px-8 sm:px-16 lg:px-24 py-24 gap-16 lg:gap-12 max-w-[90rem] mx-auto">
          <HeroContent />

          {/* Right: Zenolith Card */}
          <div className="hidden lg:block shrink-0 w-[28rem]">
            <ZenolithCard monitors={MIXED_STATE_MONITORS} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
