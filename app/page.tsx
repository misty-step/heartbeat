/**
 * Landing Page - Bento Zen Design
 *
 * DNA: [bento, brand-tinted, editorial, scroll-triggered, spacious, solid]
 * Aesthetic: Apple's bento grid meets Japanese minimalism
 * - Asymmetric cards of varying sizes
 * - Kyoto Moss palette with light/dark theme support
 * - Editorial typography with Noto Serif JP
 * - Generous whitespace, intentional negative space
 * - Scroll-triggered reveals for orchestrated motion
 *
 * Architecture follows Ousterhout principles:
 * - Deep modules: BentoCard hides styling complexity
 * - Information hiding: Animation config internalized
 * - Minimal interface: Components expose only essential props
 *
 * Truthful copy: 14-day free trial, plans from $9/mo after trial.
 */

"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Clock,
  Globe,
  History,
  LayoutDashboard,
  Shield,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      {/* Subtle paper texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025] dark:opacity-[0.015]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <Navigation />
      <HeroSection />
      <TrustBar />
      <BentoFeatures />
      <ValueSection />
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
        <div className="relative size-2.5">
          <span className="absolute inset-0 size-2.5 animate-ping rounded-full bg-accent opacity-30" />
          <span className="relative block size-2.5 rounded-full bg-accent" />
        </div>
        <span className="font-display text-lg tracking-tight text-foreground">
          Heartbeat
        </span>
      </Link>

      {/* Nav Links */}
      <div className="hidden items-center gap-8 md:flex">
        <Link
          href="/pricing"
          className="font-body text-sm text-secondary transition-colors hover:text-accent"
        >
          Pricing
        </Link>
        <a
          href="#features"
          className="font-body text-sm text-secondary transition-colors hover:text-accent"
        >
          Features
        </a>
      </div>

      {/* Theme Toggle + CTA */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link
          href="/sign-in"
          className={cn(
            "font-body text-sm font-medium text-accent transition-colors",
            "border-b border-accent/30 pb-0.5",
            "hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
    <section className="relative px-6 pb-20 pt-12 lg:px-8 lg:pb-32 lg:pt-20">
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
                "relative overflow-hidden rounded-2xl p-8 sm:p-12 lg:p-16",
                "flex min-h-[420px] flex-col justify-between lg:min-h-[520px]",
                "bg-[#2d4a3e] dark:bg-[#f5f2eb]",
              )}
            >
              {/* Subtle grid pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                aria-hidden="true"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: "32px 32px",
                }}
              />

              {/* Decorative vertical accent line */}
              <div
                className="pointer-events-none absolute left-8 top-1/2 hidden h-32 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block dark:via-black/20"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-xs text-white/70 dark:bg-black/10 dark:text-black/60">
                  <span className="size-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600" />
                  Now with public status pages
                </span>
              </div>

              <div className="relative z-10 mt-8">
                <h1 className="text-balance font-display text-4xl font-medium leading-[1.1] tracking-tight text-[#f5f2eb] drop-shadow-lg dark:text-[#1a1f1c] dark:drop-shadow-none sm:text-5xl lg:text-6xl">
                  <span className="mb-4 block font-mono text-xs font-normal uppercase tracking-[0.3em] opacity-60">
                    Uptime, distilled
                  </span>
                  Know before
                  <br />
                  your users
                  <br />
                  <span className="opacity-50">do.</span>
                </h1>

                <p className="text-pretty mt-6 max-w-md font-body text-lg leading-relaxed text-[#f5f2eb]/70 dark:text-[#1a1f1c]/70">
                  60-second checks. Three-strike confirmation. Alerts in under
                  30 seconds.
                </p>

                {/* Value reinforcement near CTA */}
                <div className="mb-4 flex items-center gap-2 text-sm text-[#f5f2eb]/60 dark:text-[#1a1f1c]/60">
                  <Shield className="size-4" />
                  <span className="font-body">
                    14-day free trial · No credit card to start · Setup in 60
                    seconds
                  </span>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/sign-up"
                    className={cn(
                      "inline-flex h-12 items-center justify-center px-8",
                      "bg-background font-body text-sm font-medium text-accent transition-all",
                      "hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background",
                    )}
                  >
                    Start 14-Day Trial
                  </Link>
                  <a
                    href="#features"
                    className={cn(
                      "inline-flex h-12 items-center justify-center border border-white/20 px-8 dark:border-black/20",
                      "font-body text-sm font-medium text-[#f5f2eb] transition-all dark:text-[#1a1f1c]",
                      "hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 dark:hover:bg-black/5",
                    )}
                  >
                    See features
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Key Benefits Bar */}
          <motion.div variants={animationProps} className="mt-6 lg:col-span-12">
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-[#ebe8e1] px-6 py-4 dark:bg-[#242a26] sm:flex-row sm:gap-8">
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
                  60-second checks
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
    { value: "99.99%", label: "Uptime SLA" },
    { value: "<30s", label: "Alert delivery" },
    { value: "3×", label: "Confirm before alert" },
    { value: "∞", label: "Unlimited viewers" },
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
            Features
          </span>
          <h2 className="text-balance font-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            Everything you need,
            <br />
            <span className="text-muted">nothing you don&apos;t</span>
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
                    Flexible monitoring
                  </h3>
                </div>

                <p className="text-pretty mb-8 max-w-md font-body text-base leading-relaxed text-secondary">
                  Check every minute for critical services, every hour for
                  everything else. You control the cadence. HTTP, HTTPS, TCP,
                  and ping supported.
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
                      className="flex items-center justify-between rounded-lg bg-[#ebe8e1] px-4 py-3 dark:bg-[#242a26]"
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
                    Smart alerting
                  </h3>
                </div>

                <p className="text-pretty mb-8 font-body text-base leading-relaxed text-secondary">
                  Three-strike rule eliminates false positives. Get notified
                  when it matters, not on every blip.
                </p>

                {/* Visual: Alert flow */}
                <div className="mt-auto">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent/10 font-mono text-xs text-accent">
                        1
                      </div>
                      <span className="font-body text-sm text-secondary">
                        First failure detected
                      </span>
                    </div>
                    <div className="ml-4 h-4 w-px bg-border" />
                    <div className="flex items-center gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent/10 font-mono text-xs text-accent">
                        2
                      </div>
                      <span className="font-body text-sm text-secondary">
                        Second failure confirmed
                      </span>
                    </div>
                    <div className="ml-4 h-4 w-px bg-border" />
                    <div className="flex items-center gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent font-mono text-xs text-white dark:text-black">
                        3
                      </div>
                      <div>
                        <span className="block font-body text-sm font-medium text-foreground">
                          Alert sent
                        </span>
                        <span className="font-mono text-xs text-degraded">
                          Email · Slack · Webhook
                        </span>
                      </div>
                    </div>
                  </div>
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
                  Public status pages
                </h3>
                <p className="text-pretty font-body text-sm leading-relaxed text-secondary">
                  Beautiful, simple status pages. Custom domain included.
                  Communicate downtime with transparency.
                </p>

                {/* Mini status preview */}
                <div className="mt-auto rounded-lg bg-[#ebe8e1] p-3 dark:bg-[#242a26]">
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
                  Forever history
                </h3>
                <p className="text-pretty font-body text-sm leading-relaxed text-secondary">
                  90 days of check history, response times, and incidents.
                  Searchable and exportable.
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
                  Lightning fast
                </h3>
                <p className="text-pretty font-body text-sm leading-relaxed text-secondary">
                  Global check infrastructure. Sub-30 second alert delivery. No
                  false positives.
                </p>

                <div className="mt-auto grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <span className="block font-display text-2xl font-light tabular-nums text-accent">
                      24ms
                    </span>
                    <span className="font-body text-xs text-muted">
                      Avg response
                    </span>
                  </div>
                  <div>
                    <span className="block font-display text-2xl font-light tabular-nums text-accent">
                      12
                    </span>
                    <span className="font-body text-xs text-muted">
                      Global nodes
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
        "h-full rounded-2xl border border-border p-6 transition-shadow duration-200",
        "bg-[#fdfcfa] dark:bg-[#2a302c]",
        "hover:shadow-lg focus-within:shadow-lg",
        className,
      )}
    >
      {children}
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
      title: "Forever history",
      description:
        "Every check, every response time, every incident. Searchable and exportable.",
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
              Built for teams who value
              <span className="text-muted"> focus over complexity</span>
            </h2>
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
// CTA SECTION
// =============================================================================

function CTASection() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section className="bg-[#2d4a3e] px-6 py-24 dark:bg-[#f5f2eb] lg:px-8">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-balance font-display text-3xl font-medium tracking-tight text-[#f5f2eb] drop-shadow-lg dark:text-[#1a1f1c] dark:drop-shadow-none sm:text-4xl">
          Start monitoring in seconds
        </h2>
        <p className="text-pretty mx-auto mb-8 mt-4 max-w-md font-body text-[#f5f2eb]/70 dark:text-[#1a1f1c]/70">
          14 days free, full access. No credit card to start.
        </p>

        {/* Value reinforcement */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-[#f5f2eb]/70 dark:text-[#1a1f1c]/70">
          <Zap className="size-4" />
          <span className="font-body">
            Setup takes 60 seconds. Know before your users do.
          </span>
        </div>

        <Link
          href="/sign-up"
          className={cn(
            "inline-flex h-14 items-center justify-center px-10",
            "bg-background font-body text-sm font-medium text-accent transition-all",
            "hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background",
          )}
        >
          Start 14-Day Trial
        </Link>

        <p className="mt-6 font-body text-xs text-[#f5f2eb]/40 dark:text-[#1a1f1c]/40">
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
    { label: "Pricing", href: "/pricing" },
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
        <span className="font-mono text-xs text-muted">© 2026 Misty Step</span>
      </div>
    </footer>
  );
}
