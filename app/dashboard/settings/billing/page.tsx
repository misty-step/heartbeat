"use client";

import { useQuery, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { TIERS, formatPrice, formatInterval } from "@/lib/tiers";
import { ArrowLeft, CreditCard, Loader2, ExternalLink } from "lucide-react";
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
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        {/* Header */}
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-2">
          Billing
        </h1>
        <p className="text-[var(--color-text-muted)] mb-12">
          Manage your subscription and billing details.
        </p>

        {subscription ? (
          <div className="space-y-8">
            {/* Current plan */}
            <section className="p-6 bg-[var(--color-bg-secondary)] border border-foreground/10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-xl text-foreground mb-1">
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
                  <div className="p-4 bg-[var(--color-bg-primary)]">
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
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 mb-6">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
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
                <div className="p-4 bg-red-500/10 border border-red-500/20 mb-6">
                  <p className="text-sm text-red-700 dark:text-red-300">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background font-medium hover:opacity-80 transition-opacity"
              >
                <CreditCard className="h-4 w-4" />
                Manage Billing
                <ExternalLink className="h-3 w-3 opacity-60" />
              </button>
            </section>

            {/* Billing period */}
            <section className="p-6 bg-[var(--color-bg-secondary)] border border-foreground/10">
              <h2 className="font-serif text-lg text-foreground mb-4">
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
              <section className="p-6 bg-[var(--color-bg-secondary)] border border-foreground/10">
                <h2 className="font-serif text-lg text-foreground mb-2">
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
          <div className="p-8 bg-[var(--color-bg-secondary)] border border-foreground/10 text-center">
            <h2 className="font-serif text-xl text-foreground mb-2">
              No active subscription
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              Choose a plan to start monitoring your sites.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium hover:opacity-80 transition-opacity"
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
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },
    active: {
      label: "Active",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    past_due: {
      label: "Past Due",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    canceled: {
      label: "Canceled",
      className: "bg-red-500/10 text-red-700 dark:text-red-300",
    },
    expired: {
      label: "Expired",
      className: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
    },
  };

  const { label, className } = config[status];

  return (
    <span className={`px-2 py-1 text-xs font-medium ${className}`}>
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
            isNearLimit ? "bg-amber-500" : "bg-emerald-500 dark:bg-emerald-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
