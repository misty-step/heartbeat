"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { usePathname } from "next/navigation";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

// Paths that should always be accessible (billing, settings)
const BYPASS_PATHS = ["/dashboard/settings/billing"];

/**
 * Gates dashboard access to users with active subscriptions.
 * Shows upgrade prompt for users without subscription or expired trials.
 * Allows access to billing pages regardless of subscription status.
 */
export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const hasActive = useQuery(
    api.subscriptions.hasActiveSubscription,
    isAuthenticated ? {} : "skip",
  );

  // Always allow access to bypass paths
  if (BYPASS_PATHS.some((path) => pathname.startsWith(path))) {
    return <>{children}</>;
  }

  // Still loading auth state
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-foreground/40" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - Clerk middleware should handle this, but just in case
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-md text-center space-y-6">
          <h1 className="font-serif text-3xl text-foreground">
            Sign in to continue
          </h1>
          <p className="text-[var(--color-text-muted)]">
            You need to be signed in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Still loading subscription status (authenticated, waiting for query)
  if (hasActive === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-foreground/40" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // No active subscription (hasActive is false, not undefined)
  if (!hasActive) {
    return (
      <div className="flex-1 flex items-center px-6 sm:px-12 lg:px-24 py-16 sm:py-24">
        <div className="w-full max-w-xl">
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight text-foreground text-balance mb-6">
            Start monitoring
            <br />
            <span className="italic">your sites</span>
          </h1>

          <p className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-md">
            Choose a plan to unlock uptime monitoring. All plans include a
            14-day free trial.
          </p>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium hover:opacity-80 transition-opacity"
          >
            View Plans
            <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="mt-8 text-sm text-[var(--color-text-muted)]">
            Already have a subscription?{" "}
            <Link
              href="/dashboard/settings/billing"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Check billing status
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Active subscription - render children
  return <>{children}</>;
}
