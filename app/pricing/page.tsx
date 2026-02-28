"use client";

import { useState } from "react";
import { useAction, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TIERS, TRIAL_DAYS, formatPrice, formatInterval } from "@/lib/tiers";
import { Footer } from "@/components/Footer";
import { Check, Loader2 } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

type Interval = "month" | "year";

export default function PricingPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const [interval, setInterval] = useState<Interval>("month");
  const [loadingTier, setLoadingTier] = useState<"pulse" | "vital" | null>(
    null,
  );

  const handleSubscribe = async (tier: "pulse" | "vital") => {
    if (!isAuthenticated) return;

    setLoadingTier(tier);
    try {
      const result = await createCheckout({ tier, interval });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="px-6 sm:px-12 lg:px-24 py-6 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-foreground">
          Heartbeat
        </Link>
        {isAuthenticated && (
          <Link
            href="/dashboard"
            className="text-sm text-[var(--color-text-muted)] hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
        )}
      </header>

      {/* Hero */}
      <section className="px-6 sm:px-12 lg:px-24 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground text-balance mb-6">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">
            No free tier. No hidden fees. Just reliable uptime monitoring that
            pays for itself the first time it catches an outage.
          </p>
        </div>
      </section>

      {/* Billing toggle */}
      <section className="px-6 sm:px-12 lg:px-24 pb-8">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setInterval("month")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              interval === "month"
                ? "text-foreground"
                : "text-[var(--color-text-muted)] hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <div className="h-4 w-px bg-foreground/20" />
          <button
            onClick={() => setInterval("year")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              interval === "year"
                ? "text-foreground"
                : "text-[var(--color-text-muted)] hover:text-foreground"
            }`}
          >
            Yearly
            <span className="ml-2 text-xs text-[var(--color-status-up)]">
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 sm:px-12 lg:px-24 pb-24">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Pulse */}
          <PricingCard
            tier="pulse"
            name={TIERS.pulse.name}
            description={TIERS.pulse.description}
            price={
              interval === "month"
                ? TIERS.pulse.monthlyPrice
                : TIERS.pulse.yearlyPrice
            }
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

          {/* Vital */}
          <PricingCard
            tier="vital"
            name={TIERS.vital.name}
            description={TIERS.vital.description}
            price={
              interval === "month"
                ? TIERS.vital.monthlyPrice
                : TIERS.vital.yearlyPrice
            }
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

        {/* Trial note */}
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-12">
          All plans include a {TRIAL_DAYS}-day free trial. Cancel anytime.
        </p>
      </section>

      <Footer />
    </div>
  );
}

interface PricingCardProps {
  tier: "pulse" | "vital";
  name: string;
  description: string;
  price: number;
  interval: Interval;
  features: string[];
  highlighted?: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  onSubscribe: () => void;
  authLoading: boolean;
}

function PricingCard({
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
}: PricingCardProps) {
  return (
    <div
      className={`p-8 rounded-xl border ${
        highlighted
          ? "bg-[var(--color-accent-primary)] text-white border-transparent shadow-lg shadow-[var(--color-accent-primary)]/20"
          : "bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)]"
      }`}
    >
      <div className="mb-6">
        <h3 className="font-display text-2xl font-extrabold mb-2">{name}</h3>
        <p
          className={`text-sm ${highlighted ? "text-white/80" : "text-[var(--color-text-muted)]"}`}
        >
          {description}
        </p>
      </div>

      <div className="mb-8">
        <span className={`font-mono text-4xl font-extrabold tabular-nums ${highlighted ? "text-white" : ""}`}>
          {formatPrice(price)}
        </span>
        <span
          className={`text-sm ${highlighted ? "text-white/60" : "text-[var(--color-text-muted)]"}`}
        >
          /{interval === "month" ? "mo" : "yr"}
        </span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check
              className={`h-4 w-4 mt-0.5 flex-shrink-0 ${highlighted ? "text-white/80" : "text-[var(--color-status-up)]"}`}
            />
            <span className={highlighted ? "text-white/90" : ""}>{feature}</span>
          </li>
        ))}
      </ul>

      {authLoading ? (
        <div className="w-full py-3 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin opacity-50" />
        </div>
      ) : isAuthenticated ? (
        <button
          onClick={onSubscribe}
          disabled={isLoading}
          className={`w-full py-3 rounded-full font-bold text-sm transition-all disabled:opacity-50 ${
            highlighted
              ? "bg-white text-[var(--color-accent-primary)] hover:opacity-90 shadow-sm"
              : "bg-[var(--color-accent-primary)] text-white hover:opacity-90 shadow-sm shadow-[var(--color-accent-primary)]/20"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            "Start Free Trial"
          )}
        </button>
      ) : (
        <SignInButton mode="modal">
          <button
            className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
              highlighted
                ? "bg-white text-[var(--color-accent-primary)] hover:opacity-90 shadow-sm"
                : "bg-[var(--color-accent-primary)] text-white hover:opacity-90 shadow-sm shadow-[var(--color-accent-primary)]/20"
            }`}
          >
            Sign up
          </button>
        </SignInButton>
      )}
    </div>
  );
}
