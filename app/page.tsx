/**
 * Landing Page - Server Component
 *
 * Field direction: warm matte surfaces, sage green accent, Plus Jakarta Sans.
 * - Asymmetric bento grid on warm stone background
 * - Extrabold headings, rounded-full CTAs, white card surfaces
 * - Generous whitespace, scroll-triggered reveals
 *
 * SSR architecture: static text renders as real HTML in the initial response.
 * Interactive islands (Navigation, PricingSection) hydrate on the client.
 * AnimateOnView wraps static content with framer-motion entrance animations.
 *
 * Truthful copy: 14-day free trial, plans from $9/mo after trial.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { safeJsonLd } from "@/lib/json-ld";
import { cn } from "@/lib/cn";
import {
  Bell,
  Clock,
  Globe,
  History,
  LayoutDashboard,
  Shield,
  Zap,
} from "lucide-react";

import { Navigation } from "@/components/landing/Navigation";
import { PricingSection } from "@/components/landing/PricingSection";
import { HeroMonitorPanel } from "@/components/landing/HeroMonitorPanel";
import {
  AnimateOnView,
  FadeOnView,
  StaggerReveal,
  StaggerChild,
} from "@/components/landing/AnimateOnView";

export const metadata: Metadata = {
  title: "Heartbeat — Uptime monitoring that simply works",
  description:
    "Set-and-forget uptime monitoring with beautiful status pages. Checks every 1-60 minutes, three-strike confirmation, alerts in under 30 seconds. 14-day free trial.",
  alternates: { canonical: "https://heartbeat.cool" },
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Heartbeat",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://heartbeat.cool",
  description:
    "Set-and-forget uptime monitoring with beautiful status pages and real-time alerts.",
  offers: [
    {
      "@type": "Offer",
      name: "Pulse",
      price: "9.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description: "10 monitors, 3-minute intervals, 1 status page, 30-day history",
    },
    {
      "@type": "Offer",
      name: "Vital",
      price: "29.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description: "50 monitors, 1-minute intervals, 5 status pages, 90-day history, webhooks",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How often does Heartbeat check my site?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Heartbeat checks your URLs at configurable intervals from every 1 minute (Vital plan) to every 60 minutes. The Pulse plan starts at 3-minute intervals.",
      },
    },
    {
      "@type": "Question",
      name: "How does Heartbeat prevent false alarms?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Heartbeat uses a three-strike confirmation system. An alert is only sent after 3 consecutive failures, eliminating false positives from transient network issues.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Heartbeat cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Heartbeat offers two plans: Pulse at $9/month (10 monitors) and Vital at $29/month (50 monitors). Both include a 14-day free trial with full access. Yearly billing saves 20%.",
      },
    },
    {
      "@type": "Question",
      name: "Can I create a public status page?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Heartbeat includes beautiful public status pages with 7 distinct themes. Pulse includes 1 status page, Vital includes 5. Status pages show real-time uptime, response times, and incident history.",
      },
    },
  ],
};

// =============================================================================
// MAIN PAGE (SERVER COMPONENT)
// =============================================================================

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(softwareAppJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(faqJsonLd),
        }}
      />
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
// HERO SECTION
// =============================================================================

function HeroSection() {
  return (
    <section className="relative px-6 pb-8 pt-12 lg:px-8 lg:pb-12 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        <StaggerReveal className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          {/* Main Hero Card - full width */}
          <StaggerChild className="col-span-full">
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

                {/* Right: product preview (server component) */}
                <HeroMonitorPanel />
              </div>
            </div>
          </StaggerChild>

          {/* Key Benefits Bar */}
          <StaggerChild className="lg:col-span-12">
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
          </StaggerChild>
        </StaggerReveal>
      </div>
    </section>
  );
}

// =============================================================================
// TRUST BAR
// =============================================================================

function TrustBar() {
  const stats = [
    { value: "3 min", label: "Min check interval" },
    { value: "<30s", label: "Alert delivery" },
    { value: "3\u00d7", label: "Confirm before alert" },
    { value: "30\u201390d", label: "Check history" },
  ];

  return (
    <FadeOnView className="border-y border-border px-6 py-12 lg:px-8">
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
    </FadeOnView>
  );
}

// =============================================================================
// BENTO FEATURES GRID
// =============================================================================

function BentoFeatures() {
  return (
    <section id="features" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <AnimateOnView className="mb-16 text-center">
          <span className="mb-4 block font-body text-xs uppercase tracking-[0.3em] text-muted">
            How it works
          </span>
          <h2 className="text-balance font-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
            You sleep.
            <br />
            <span className="text-muted">Heartbeat watches.</span>
          </h2>
        </AnimateOnView>

        {/* Bento Grid */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-12">
          {/* Large Feature - Monitoring */}
          <AnimateOnView delay={0} className="sm:col-span-2 lg:col-span-7">
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
          </AnimateOnView>

          {/* Medium Feature - Smart Alerts */}
          <AnimateOnView delay={0.1} className="sm:col-span-1 lg:col-span-5">
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
                    {
                      label: "Third failure",
                      note: "Alert sent \u00b7 Email \u00b7 Webhook",
                      final: true,
                    },
                  ].map((step, i, arr) => (
                    <div key={i}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              step.final
                                ? "bg-accent"
                                : "bg-[var(--color-border-default)]",
                            )}
                          />
                          <span className="font-body text-sm text-secondary">
                            {step.label}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "font-mono text-xs",
                            step.final ? "text-accent" : "text-muted",
                          )}
                        >
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
          </AnimateOnView>

          {/* Small Feature - Public Status */}
          <AnimateOnView delay={0.2} className="sm:col-span-1 lg:col-span-4">
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
          </AnimateOnView>

          {/* Small Feature - History */}
          <AnimateOnView delay={0.3} className="sm:col-span-1 lg:col-span-4">
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
          </AnimateOnView>

          {/* Small Feature - Speed */}
          <AnimateOnView delay={0.4} className="sm:col-span-1 lg:col-span-4">
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
          </AnimateOnView>
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
// VALUE PROPOSITION SECTION
// =============================================================================

function ValueSection() {
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
          <AnimateOnView>
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
          </AnimateOnView>

          {/* Right: Values List */}
          <AnimateOnView delay={0.1} className="space-y-10">
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
          </AnimateOnView>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// CTA SECTION
// =============================================================================

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-secondary)] field-grain px-6 py-24 lg:px-8">
      <AnimateOnView className="relative mx-auto max-w-2xl text-center">
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
      </AnimateOnView>
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
          &copy; 2026{" "}
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
