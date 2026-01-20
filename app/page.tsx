/**
 * Landing Page - Kyoto Moss Design System
 *
 * Aesthetic: Bento Grid - asymmetric dashboard layout with film grain
 * The status card displays real mixed-state data to demonstrate product value.
 *
 * Architecture follows Ousterhout principles:
 * - BentoGridCard: deep module hiding status logic
 * - StatItem: inline (trivial, no abstraction needed)
 * - Server component: no client JS unless necessary
 *
 * Skills applied:
 * - ui-skills: No gradients, tabular-nums, text-balance, focus-visible
 * - frontend-design: Bold editorial direction, generous negative space
 * - web-interface-guidelines: Semantic HTML, ARIA, focus states
 * - rams: Accessible, proper heading hierarchy
 */

import Link from "next/link";
import { Footer } from "@/components/Footer";
import {
  BentoGridCard,
  MIXED_STATE_MONITORS,
} from "@/components/landing/StatusDisplayVariants";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg-primary)]">
      {/* Hero - Bento Grid with film grain */}
      <HeroSection />

      {/* Stats - Clean data row */}
      <StatsSection />

      {/* Value proposition */}
      <ValueSection />

      {/* Final CTA */}
      <CTASection />

      <Footer />
    </div>
  );
}

// ============================================================================
// Hero Section - Bento Grid
// Film grain + dot grid + asymmetric layout with BentoGridCard
// ============================================================================

function HeroSection() {
  return (
    <section className="min-h-dvh relative overflow-hidden">
      {/* Film grain texture */}
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

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-text-primary) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative min-h-dvh flex flex-col lg:flex-row items-center lg:justify-between px-8 sm:px-16 lg:px-24 py-24 gap-16 lg:gap-12 max-w-[90rem] mx-auto">
        {/* Left: Hero copy */}
        <div className="text-center lg:text-left lg:flex-[1_1_auto]">
          <h1 className="font-serif text-7xl sm:text-8xl lg:text-9xl leading-[0.9] text-[var(--color-text-primary)] tracking-tight">
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
            <Link
              href="/sign-in"
              className="inline-flex px-8 py-4 border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-secondary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-primary)]"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Right: Bento Grid Card */}
        <div className="hidden lg:block shrink-0 w-[32rem]">
          <BentoGridCard monitors={MIXED_STATE_MONITORS} />
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Stats Section
// Four key metrics in a clean grid
// ============================================================================

function StatsSection() {
  return (
    <section className="py-20 px-8 sm:px-16 lg:px-24 border-t border-[var(--color-border-subtle)]">
      <div className="max-w-[80rem] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          <StatItem value="90" unit="days" label="History retained" />
          <StatItem value="60" unit="sec" label="Check interval" />
          <StatItem value="3" unit="" label="Failures to alert" />
          <StatItem value="∞" unit="" label="Public viewers" />
        </div>
      </div>
    </section>
  );
}

/**
 * StatItem - Inline component (Ousterhout: trivial, no abstraction needed)
 * Uses tabular-nums per ui-skills
 */
function StatItem({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-4xl tabular-nums text-[var(--color-text-primary)]">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-sm text-[var(--color-text-muted)]">
            {unit}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{label}</p>
    </div>
  );
}

// ============================================================================
// Value Section
// Trust statement - centered, editorial
// ============================================================================

function ValueSection() {
  return (
    <section className="py-24 px-8 sm:px-16 lg:px-24 bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-[36rem] mx-auto text-center">
        <h2 className="font-serif text-3xl lg:text-4xl text-[var(--color-text-primary)] text-balance">
          Trust is built in the open.
        </h2>
        <p className="mt-6 text-lg text-[var(--color-text-secondary)] text-pretty">
          When something goes wrong, your customers deserve to know. Public
          status pages show them you have nothing to hide.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// CTA Section
// Inverted colors for contrast
// ============================================================================

function CTASection() {
  return (
    <section className="py-24 px-8 sm:px-16 lg:px-24 bg-[var(--color-bg-inverse)]">
      <div className="w-full max-w-[36rem] mx-auto text-center">
        <h2 className="font-serif text-3xl text-[var(--color-text-inverse)] text-balance">
          Start in 30 seconds.
        </h2>
        <p className="mt-4 text-[var(--color-text-inverse)]/70 text-pretty">
          Free tier available. No credit card required.
        </p>
        <div className="mt-8">
          <Link
            href="/sign-up"
            className="inline-flex px-8 py-4 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-secondary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-bg-primary)]"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </section>
  );
}
