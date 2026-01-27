"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { StatusIndicator } from "@/components/StatusIndicator";

/**
 * Root Error Boundary - Kyoto Moss Design System
 *
 * Catches runtime crashes outside nested segments.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center px-6 sm:px-12 lg:px-24 relative overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Background Texture */}
      <div className="absolute inset-0 zen-dot-matrix opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)] via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start gap-8">
        {/* Status indicator + title */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-down-muted blur-xl rounded-full animate-km-breathe-subtle" />
            <StatusIndicator status="down" size="xl" cinematic />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-[var(--color-text-primary)] tracking-tight">
            Something went wrong
          </h1>
        </div>

        <p className="text-[var(--color-text-secondary)] max-w-md">
          We encountered an unexpected error. Please try again.
        </p>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="group relative inline-flex items-center justify-center px-6 py-3 border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 rounded-[var(--radius-md)]"
          >
            <span className="font-mono text-sm text-[var(--color-text-primary)]">
              Try again
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
