/**
 * Landing Page - Field Design
 *
 * Field direction: warm matte surfaces, sage green accent, Plus Jakarta Sans.
 * - Asymmetric bento grid on warm stone background
 * - Extrabold headings, rounded-full CTAs, white card surfaces
 * - Generous whitespace, scroll-triggered reveals
 *
 * Architecture follows Ousterhout principles:
 * - Deep modules: BentoCard hides styling complexity
 * - Information hiding: Animation config internalized
 * - Minimal interface: Components expose only essential props
 *
 * Truthful copy: 14-day free trial, plans from $9/mo after trial.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Check,
  Clock,
  Globe,
  History,
  LayoutDashboard,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TIERS, TRIAL_DAYS, formatPrice, formatInterval } from "@/lib/tiers";
import { SignInButton } from "@clerk/nextjs";


// =============================================================================
// ANIMATION CONFIG
// =============================================================================

const fadeInUp = (shouldReduceMotion: boolean) => ({
  initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
});

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground antialiased">

      <Navigation />
      <HeroSection />
      <TrustBar />
      <BentoFeatures />
      <ValueSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}

// =============================================================================
// NAVIGATION
// =============================================================================

function Navigation() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  return (
    <motion.nav
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8"
    >
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
    </motion.nav>
  );
}

// =============================================================================
// HERO SECTION
// =============================================================================

function HeroSection() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const animationProps = fadeInUp(shouldReduceMotion);

  return (
    <section className="relative px-6 pb-8 pt-12 lg:px-8 lg:pb-12 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={shouldReduceMotion ? "animate" : "initial"}
          animate="animate"
          variants={staggerContainer}
          className="grid gap-8 lg:grid-cols-12 lg:gap-6"
        >
          {/* Main Hero Card - full width */}
          <motion.div variants={animationProps} className="col-span-full">
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-8 sm:p-12",
                "bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-md)] washi-texture field-grain",
              )}
            >
              <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                {/* Left: content */}
                <div>
                  <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    Know before
                    <br />
                    your users
                    <br />
                    <span className="text-muted">do.</span>
                  </h1>

                  <p className="text-pretty mt-6 max-w-md font-body text-lg leading-relaxed text-secondary">
                    Checks as often as every minute. Three-strike confirmation.
                    Alerts in under a minute.
                  </p>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link
                      href="/sign-up"
                      className={cn(
                        "inline-flex h-12 items-center justify-center rounded-full px-8",
                        "bg-accent text-white font-body text-sm font-bold transition-all",
                        "shadow-md shadow-accent/20 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      )}
                    >
                      Start 14-Day Trial
                    </Link>
                    <a
                      href="#features"
                      className={cn(
                        "inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border-default)] px-8",
                        "font-body text-sm font-medium text-secondary transition-all",
                        "hover:bg-[var(--color-bg-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      )}
                    >
                      See features
                    </a>
                  </div>
                </div>

                {/* Right: product preview */}
                <HeroMonitorPanel />
              </div>
            </div>
          </motion.div>

          {/* Key Benefits Bar */}
          <motion.div variants={animationProps} className="lg:col-span-12">
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] px-6 py-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-accent" />
                <span className="font-body text-sm text-secondary">
                  No false alarms
                </span>
              </div>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-accent" />
                <span className="font-body text-sm text-secondary">
                  Down in under a minute
                </span>
              </div>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-accent" />
                <span className="font-body text-sm text-secondary">
                  Alerts in under 30 seconds
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// =============================================================================
// TRUST BAR
// =============================================================================

function TrustBar() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const stats = [
    { value: "3 min", label: "Min check interval" },
    { value: "<30s", label: "Alert delivery" },
    { value: "3×", label: "Confirm before alert" },
    { value: "30–90d", label: "Check history" },
  ];

  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="border-y border-border px-6 py-12 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <span className="block font-display text-3xl font-light tabular-nums tracking-tight text-accent">
                {stat.value}
              </span>
              <span className="mt-1 block font-body text-xs uppercase tracking-[0.2em] text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// =============================================================================
// BENTO FEATURES GRID
// =============================================================================

function BentoFeatures() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section id="features" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 block font-body text-xs uppercase tracking-[0.3em] text-muted">
            How it works
          </span>
          <h2 className="text-balance font-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            You sleep.
            <br />
            <span className="text-muted">Heartbeat watches.</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-12">
          {/* Large Feature - Monitoring */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0 }}
            className="sm:col-span-2 lg:col-span-7"
          >
            <BentoCard className="min-h-[400px]">
              <div className="flex h-full flex-col">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
                    <Globe className="size-5 text-accent" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-foreground">
                    Always watching
                  </h3>
                </div>

                <p className="text-pretty mb-8 max-w-md font-body text-base leading-relaxed text-secondary">
                  Add any HTTP or HTTPS URL and pick a check interval — every 3
                  minutes, every hour, or anything in between. Heartbeat runs
                  quietly around the clock.
                </p>

                {/* Visual: Monitor list preview */}
                <div className="mt-auto space-y-2">
                  {[
                    {
                      name: "api.production.com",
                      interval: "1 min",
                      last: "12s ago",
                    },
                    {
                      name: "blog.mysite.com",
                      interval: "5 min",
                      last: "3m ago",
                    },
                    {
                      name: "legacy-service.io",
                      interval: "30 min",
                      last: "12m ago",
                    },
                  ].map((monitor, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-accent" />
                        <span className="font-body text-sm text-foreground">
                          {monitor.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-muted">
                          {monitor.interval}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-muted">
                          {monitor.last}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* Medium Feature - Smart Alerts */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="sm:col-span-1 lg:col-span-5"
          >
            <BentoCard className="min-h-[400px]">
              <div className="flex h-full flex-col">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
                    <Bell className="size-5 text-accent" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-foreground">
                    Zero false alarms
                  </h3>
                </div>

                <p className="text-pretty mb-8 font-body text-base leading-relaxed text-secondary">
                  Three-strike rule eliminates false positives. Get notified
                  when it matters, not on every blip.
                </p>

                {/* Visual: Alert flow */}
                <div className="mt-auto space-y-px">
                  {[
                    { label: "First failure", note: "Logged, not alerted" },
                    { label: "Second failure", note: "Still watching" },
                    { label: "Third failure", note: "Alert sent · Email · Webhook", final: true },
                  ].map((step, i, arr) => (
                    <div key={i}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            step.final ? "bg-accent" : "bg-[var(--color-border-default)]",
                          )} />
                          <span className="font-body text-sm text-secondary">
                            {step.label}
                          </span>
                        </div>
                        <span className={cn(
                          "font-mono text-xs",
                          step.final ? "text-accent" : "text-muted",
                        )}>
                          {step.note}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="ml-[2.75px] h-3 w-px bg-[var(--color-border-default)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* Small Feature - Public Status */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="sm:col-span-1 lg:col-span-4"
          >
            <BentoCard className="min-h-[280px]">
              <div className="flex h-full flex-col">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/10">
                  <LayoutDashboard className="size-5 text-accent" />
                </div>
                <h3 className="mb-2 font-display text-lg font-medium text-foreground">
                  Keep users informed
                </h3>
                <p className="text-pretty font-body text-sm leading-relaxed text-secondary">
                  Beautiful, simple status pages at yourapp.heartbeat.cool.
                  Communicate downtime with transparency.
                </p>

                {/* Mini status preview */}
                <div className="mt-auto rounded-lg bg-[var(--color-bg-secondary)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-body text-xs font-medium text-foreground">
                      System Status
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-accent">
                      <span className="size-1.5 rounded-full bg-current" />
                      All good
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-6 flex-1 rounded-sm bg-accent"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* Small Feature - History */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="sm:col-span-1 lg:col-span-4"
          >
            <BentoCard className="min-h-[280px]">
              <div className="flex h-full flex-col">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/10">
                  <History className="size-5 text-accent" />
                </div>
                <h3 className="mb-2 font-display text-lg font-medium text-foreground">
                  Full check history
                </h3>
                <p className="text-pretty font-body text-sm leading-relaxed text-secondary">
                  Up to 90 days of checks, response times, and incidents —
                  searchable from your dashboard.
                </p>

                {/* Mini chart */}
                <div className="mt-auto flex items-end gap-1 pt-4">
                  {[40, 65, 45, 80, 55, 70, 35, 60, 50, 75, 45, 55].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-accent"
                        style={{
                          height: `${h}%`,
                          opacity: 0.3 + i / 24,
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* Small Feature - Speed */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="sm:col-span-1 lg:col-span-4"
          >
            <BentoCard className="min-h-[280px]">
              <div className="flex h-full flex-col">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/10">
                  <Zap className="size-5 text-accent" />
                </div>
                <h3 className="mb-2 font-display text-lg font-medium text-foreground">
                  Down in seconds
                </h3>
                <p className="text-pretty font-body text-sm leading-relaxed text-secondary">
                  Sub-30 second alert delivery. No false positives.
                </p>

                <div className="mt-auto grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <span className="block font-display text-2xl font-light tabular-nums text-accent">
                      3 min
                    </span>
                    <span className="font-body text-xs text-muted">
                      Min interval (Pulse)
                    </span>
                  </div>
                  <div>
                    <span className="block font-display text-2xl font-light tabular-nums text-accent">
                      90d
                    </span>
                    <span className="font-body text-xs text-muted">
                      History (Vital)
                    </span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// BENTO CARD - Deep module hiding styling complexity
// =============================================================================

function BentoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-full rounded-xl border border-[var(--color-border-subtle)] p-6 transition-shadow duration-200",
        "bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]",
        "hover:shadow-[var(--shadow-md)] focus-within:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// HERO MONITOR PANEL — product preview placed in hero right column
// Deterministic tick data (SSR-safe, no Math.random)
// =============================================================================

function HeroMonitorPanel() {
  const monitors = [
    {
      name: "API",
      ms: "47ms",
      uptime: "99.3%",
      // 45 ticks — positions 8 and 31 are down
      ticks: Array.from({ length: 45 }, (_, i) => i !== 8 && i !== 31),
    },
    {
      name: "Web app",
      ms: "83ms",
      uptime: "100%",
      ticks: Array.from({ length: 45 }, () => true),
    },
    {
      name: "Checkout",
      ms: "112ms",
      uptime: "97.8%",
      // positions 5, 22, 38 are down
      ticks: Array.from({ length: 45 }, (_, i) => i !== 5 && i !== 22 && i !== 38),
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
      {/* URL + operational status */}
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-xs text-muted">heartbeat.cool/s/acme</span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-accent">
          <span className="size-1.5 rounded-full bg-accent" />
          All systems up
        </span>
      </div>

      {/* Monitor rows */}
      <div className="space-y-4">
        {monitors.map((monitor) => (
          <div key={monitor.name}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-body text-sm text-secondary">{monitor.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">{monitor.ms}</span>
                <span className="w-10 text-right font-mono text-xs text-accent">
                  {monitor.uptime}
                </span>
              </div>
            </div>
            <div className="flex gap-px">
              {monitor.ticks.map((up, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-5 flex-1 rounded-[1px]",
                    up ? "bg-accent" : "bg-[var(--color-border-default)]",
                  )}
                  style={{ opacity: up ? 0.3 + (i / monitor.ticks.length) * 0.7 : 0.5 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
        <span className="font-mono text-xs text-muted">45-day history</span>
        <span className="font-mono text-xs text-muted">checked 43s ago</span>
      </div>
    </div>
  );
}

// =============================================================================
// VALUE PROPOSITION SECTION
// =============================================================================

function ValueSection() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const values = [
    {
      icon: Shield,
      title: "No alert fatigue",
      description:
        "We only notify you after three consecutive failures. Your sleep is sacred.",
    },
    {
      icon: History,
      title: "Full check history",
      description:
        "Every check, response time, and incident — up to 90 days on Vital, 30 days on Pulse.",
    },
    {
      icon: Zap,
      title: "Set-and-forget simplicity",
      description:
        "Configure once. Heartbeat runs quietly in the background for years.",
    },
  ];

  return (
    <section className="border-t border-border px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left: Header */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 block font-body text-xs uppercase tracking-[0.3em] text-muted">
              Why Heartbeat
            </span>
            <h2 className="text-balance font-display text-3xl font-light leading-snug tracking-tight text-foreground">
              Monitoring that stays
              <span className="text-muted"> out of your way</span>
            </h2>
            <p className="text-pretty mt-4 max-w-sm font-body text-sm leading-relaxed text-secondary">
              Most monitoring tools demand constant attention. Heartbeat is
              designed to disappear until the moment you need it.
            </p>
          </motion.div>

          {/* Right: Values List */}
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-10"
          >
            {values.map((value, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <value.icon className="size-5 text-accent" />
                </div>
                <div>
                  <h3 className="mb-1 font-display text-base font-medium text-foreground">
                    {value.title}
                  </h3>
                  <p className="text-pretty font-body text-sm leading-relaxed text-secondary">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// PRICING SECTION
// =============================================================================

type BillingInterval = "month" | "year";

interface LandingPricingCardProps {
  tier: "pulse" | "vital";
  name: string;
  description: string;
  price: number;
  interval: BillingInterval;
  features: string[];
  highlighted?: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  onSubscribe: () => void;
  authLoading: boolean;
}

function LandingPricingCard({
  name,
  description,
  price,
  interval,
  features,
  highlighted,
  isAuthenticated,
  isLoading,
  onSubscribe,
  authLoading,
}: LandingPricingCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-8",
        highlighted
          ? "border-accent bg-accent/5 shadow-[var(--shadow-md)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]",
      )}
    >
      <div className="mb-6">
        <h3 className="mb-2 font-display text-2xl font-extrabold text-foreground">
          {name}
        </h3>
        <p className="font-body text-sm text-muted">{description}</p>
      </div>

      <div className="mb-8">
        <span className="font-mono text-4xl font-extrabold tabular-nums text-foreground">
          {formatPrice(price)}
        </span>
        <span className="font-body text-sm text-muted">
          /{interval === "month" ? "mo" : "yr"}
        </span>
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 font-body text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-accent" />
            <span className="text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      {authLoading ? (
        <div className="flex w-full justify-center py-3">
          <Loader2 className="size-5 animate-spin opacity-50" />
        </div>
      ) : isAuthenticated ? (
        <button
          onClick={onSubscribe}
          disabled={isLoading}
          className={cn(
            "inline-flex w-full items-center justify-center rounded-full py-3",
            "font-body text-sm font-bold transition-all disabled:opacity-50",
            highlighted
              ? "bg-accent text-white shadow-md shadow-accent/20 hover:opacity-90"
              : "border border-[var(--color-border-default)] text-secondary hover:bg-[var(--color-bg-secondary)]",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            "Start Free Trial"
          )}
        </button>
      ) : (
        <SignInButton mode="modal">
          <button
            className={cn(
              "inline-flex w-full items-center justify-center rounded-full py-3",
              "font-body text-sm font-bold transition-all",
              highlighted
                ? "bg-accent text-white shadow-md shadow-accent/20 hover:opacity-90"
                : "border border-[var(--color-border-default)] text-secondary hover:bg-[var(--color-bg-secondary)]",
            )}
          >
            Sign up
          </button>
        </SignInButton>
      )}
    </div>
  );
}

function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loadingTier, setLoadingTier] = useState<"pulse" | "vital" | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const handleSubscribe = async (tier: "pulse" | "vital") => {
    if (!isAuthenticated) return;
    setLoadingTier(tier);
    try {
      const result = await createCheckout({ tier, interval });
      if (result.url) window.location.href = result.url;
    } catch {
      setLoadingTier(null);
    }
  };

  return (
    <motion.section
      id="pricing"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="border-t border-border px-6 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <span className="mb-4 block font-body text-xs uppercase tracking-[0.3em] text-muted">
            Pricing
          </span>
          <h2 className="text-balance font-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="text-pretty mx-auto mt-4 max-w-md font-body text-sm leading-relaxed text-secondary">
            No free tier. No hidden fees. {TRIAL_DAYS}-day free trial on all plans.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setInterval("month")}
            className={cn(
              "px-4 py-2 font-body text-sm font-medium transition-colors",
              interval === "month" ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => setInterval("year")}
            className={cn(
              "px-4 py-2 font-body text-sm font-medium transition-colors",
              interval === "year" ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            Yearly
            <span className="ml-2 font-body text-xs text-accent">Save 20%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <LandingPricingCard
            tier="pulse"
            name={TIERS.pulse.name}
            description={TIERS.pulse.description}
            price={interval === "month" ? TIERS.pulse.monthlyPrice : TIERS.pulse.yearlyPrice}
            interval={interval}
            features={[
              `${TIERS.pulse.monitors} monitors`,
              `${formatInterval(TIERS.pulse.minInterval)} minimum interval`,
              `${TIERS.pulse.statusPages} public status page`,
              `${TIERS.pulse.historyDays} days history`,
              "Email notifications",
            ]}
            isAuthenticated={isAuthenticated}
            isLoading={loadingTier === "pulse"}
            onSubscribe={() => handleSubscribe("pulse")}
            authLoading={authLoading}
          />
          <LandingPricingCard
            tier="vital"
            name={TIERS.vital.name}
            description={TIERS.vital.description}
            price={interval === "month" ? TIERS.vital.monthlyPrice : TIERS.vital.yearlyPrice}
            interval={interval}
            features={[
              `${TIERS.vital.monitors} monitors`,
              `${formatInterval(TIERS.vital.minInterval)} minimum interval`,
              `${TIERS.vital.statusPages} public status pages`,
              `${TIERS.vital.historyDays} days history`,
              "Email notifications",
              "Webhook integrations",
              "API access — coming soon",
            ]}
            highlighted
            isAuthenticated={isAuthenticated}
            isLoading={loadingTier === "vital"}
            onSubscribe={() => handleSubscribe("vital")}
            authLoading={authLoading}
          />
        </div>

        <p className="mt-12 text-center font-body text-sm text-muted">
          All plans include a {TRIAL_DAYS}-day free trial. Cancel anytime.
        </p>
      </div>
    </motion.section>
  );
}

// =============================================================================
// CTA SECTION
// =============================================================================

function CTASection() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-secondary)] field-grain px-6 py-24 lg:px-8">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-2xl text-center"
      >
        <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Your site should be monitored.
        </h2>
        <p className="text-pretty mx-auto mb-8 mt-4 max-w-md font-body text-secondary">
          14-day free trial, full access. No credit card to start.
        </p>

        <Link
          href="/sign-up"
          className={cn(
            "inline-flex h-14 items-center justify-center rounded-full px-10",
            "bg-accent font-body text-sm font-bold text-white transition-all",
            "shadow-lg shadow-accent/20 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          )}
        >
          Start 14-Day Trial
        </Link>

        <p className="mt-6 font-body text-xs text-muted">
          Plans from $9/mo after trial. Cancel anytime.
        </p>
      </motion.div>
    </section>
  );
}

// =============================================================================
// FOOTER
// =============================================================================

function Footer() {
  const links = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "#pricing" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ];

  return (
    <footer className="border-t border-border px-6 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 sm:flex-row">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-accent opacity-50" />
          <span className="font-display text-sm text-muted">Heartbeat</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-body text-xs text-muted transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <span className="font-mono text-xs text-muted">
          © 2026{" "}
          <a
            href="https://mistystep.io"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent"
          >
            Misty Step
          </a>
        </span>
      </div>
    </footer>
  );
}
