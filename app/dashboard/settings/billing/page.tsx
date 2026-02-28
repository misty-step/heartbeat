"use client";

import { useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { TIERS, formatPrice, formatInterval } from "@/lib/tiers";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  ExternalLink,
  Bell,
} from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const subscription = useQuery(
    api.subscriptions.getSubscription,
    isAuthenticated ? {} : "skip",
  );
  const usage = useQuery(
    api.subscriptions.getUsage,
    isAuthenticated ? {} : "skip",
  );
  const createPortal = useAction(api.stripe.createBillingPortalSession);

  const handleManageBilling = async () => {
    try {
      const result = await createPortal();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    }
  };

  if (authLoading || subscription === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-foreground/40" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  const tier = subscription ? TIERS[subscription.tier] : null;

  return (
    <div className="px-6 sm:px-12 lg:px-24 py-8 sm:py-12">
      <div className="max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-6">
          Settings
        </h1>

        {/* Settings navigation */}
        <div className="flex gap-1 border-b border-foreground/10 mb-8">
          <Link
            href="/dashboard/settings"
            className="px-4 py-3 text-foreground/50 hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </span>
          </Link>
          <div className="px-4 py-3 text-foreground font-medium border-b-2 border-foreground -mb-px">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </span>
          </div>
        </div>

        {/* Section header */}
        <p className="text-[var(--color-text-muted)] mb-8">
          Manage your subscription and billing details.
        </p>

        {subscription ? (
          <div className="space-y-8">
            {/* Current plan */}
            <section className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl text-foreground mb-1">
                    {tier?.name} Plan
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {tier?.description}
                  </p>
                </div>
                <StatusBadge status={subscription.status} />
              </div>

              {/* Usage */}
              {usage && (
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <UsageStat
                    label="Monitors"
                    used={usage.monitors}
                    limit={usage.monitorLimit}
                  />
                  <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">
                      Min. interval
                    </p>
                    <p className="text-lg tabular-nums text-foreground">
                      {formatInterval(usage.minInterval)}
                    </p>
                  </div>
                </div>
              )}

              {/* Trial notice */}
              {subscription.status === "trialing" && subscription.trialEnd && (
                <div className="p-4 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 mb-6">
                  <p className="text-sm text-amber-900 dark:text-amber-300">
                    Your trial ends on{" "}
                    {new Date(subscription.trialEnd).toLocaleDateString()}.
                    {subscription.cancelAtPeriodEnd
                      ? " Your subscription will not renew."
                      : " You'll be charged automatically when it ends."}
                  </p>
                </div>
              )}

              {/* Cancel notice */}
              {subscription.cancelAtPeriodEnd && (
                <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 mb-6">
                  <p className="text-sm text-red-900 dark:text-red-300">
                    Your subscription is set to cancel on{" "}
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                    . You can reactivate it from the billing portal.
                  </p>
                </div>
              )}

              {/* Manage button */}
              <button
                onClick={handleManageBilling}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent-primary)] text-white font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                <CreditCard className="h-4 w-4" />
                Manage Billing
                <ExternalLink className="h-3 w-3 opacity-60" />
              </button>
            </section>

            {/* Billing period */}
            <section className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)]">
              <h2 className="font-display text-lg text-foreground mb-4">
                Billing Period
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--color-text-muted)] mb-1">
                    Current period ends
                  </p>
                  <p className="text-foreground tabular-nums">
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] mb-1">
                    Next payment
                  </p>
                  <p className="text-foreground tabular-nums">
                    {subscription.cancelAtPeriodEnd ? (
                      <span className="text-[var(--color-text-muted)]">
                        No upcoming payment
                      </span>
                    ) : (
                      formatPrice(tier?.monthlyPrice ?? 0)
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Upgrade section */}
            {subscription.tier === "pulse" && (
              <section className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)]">
                <h2 className="font-display text-lg text-foreground mb-2">
                  Need more?
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  Upgrade to Vital for more monitors, faster intervals, and
                  webhook integrations.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-80 transition-opacity"
                >
                  View Plans
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </section>
            )}
          </div>
        ) : (
          <div className="p-8 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] text-center">
            <h2 className="font-display text-xl text-foreground mb-2">
              No active subscription
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              Choose a plan to start monitoring your sites.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent-primary)] text-white font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              View Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
}) {
  const config = {
    trialing: {
      label: "Trial",
      className:
        "bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]",
    },
    active: {
      label: "Active",
      className:
        "bg-[var(--color-status-up-muted)] text-[var(--color-status-up)]",
    },
    past_due: {
      label: "Past Due",
      className:
        "bg-[var(--color-status-degraded-muted)] text-[var(--color-status-degraded)]",
    },
    canceled: {
      label: "Canceled",
      className:
        "bg-[var(--color-status-down-muted)] text-[var(--color-status-down)]",
    },
    expired: {
      label: "Expired",
      className:
        "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]",
    },
  };

  const { label, className } = config[status];

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full ${className}`}>
      {label}
    </span>
  );
}

function UsageStat({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <div className="p-4 bg-[var(--color-bg-primary)]">
      <p className="text-sm text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-lg tabular-nums text-foreground mb-2">
        {used} / {limit}
      </p>
      <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isNearLimit ? "bg-[var(--color-status-degraded)]" : "bg-[var(--color-status-up)]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
