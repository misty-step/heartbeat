"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Check, Loader2 } from "lucide-react";
import { useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TIERS, TRIAL_DAYS, formatPrice, formatInterval } from "@/lib/tiers";
import { SignInButton } from "@clerk/nextjs";
import { AnimateOnView } from "./AnimateOnView";

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

export function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loadingTier, setLoadingTier] = useState<"pulse" | "vital" | null>(
    null,
  );
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const createCheckout = useAction(api.stripe.createCheckoutSession);

  const handleSubscribe = async (tier: "pulse" | "vital") => {
    if (!isAuthenticated) return;
    setLoadingTier(tier);
    try {
      const result = await createCheckout({ tier, interval });
      if (result.url) {
        window.location.href = result.url;
      } else {
        console.error("[Checkout] No URL returned from session");
        setLoadingTier(null);
      }
    } catch (err) {
      console.error("[Checkout] Failed to create session:", err);
      setLoadingTier(null);
    }
  };

  return (
    <AnimateOnView>
      <section
        id="pricing"
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
              No free tier. No hidden fees. {TRIAL_DAYS}-day free trial on all
              plans.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="mb-10 flex items-center justify-center gap-4">
            <button
              onClick={() => setInterval("month")}
              className={cn(
                "px-4 py-2 font-body text-sm font-medium transition-colors",
                interval === "month"
                  ? "text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={() => setInterval("year")}
              className={cn(
                "px-4 py-2 font-body text-sm font-medium transition-colors",
                interval === "year"
                  ? "text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              Yearly
              <span className="ml-2 font-body text-xs text-accent">
                Save 20%
              </span>
            </button>
          </div>

          {/* Cards */}
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <LandingPricingCard
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
            <LandingPricingCard
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

          <p className="mt-12 text-center font-body text-sm text-muted">
            All plans include a {TRIAL_DAYS}-day free trial. Cancel anytime.
          </p>
        </div>
      </section>
    </AnimateOnView>
  );
}
