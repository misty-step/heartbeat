import Link from "next/link";
import { StatusIndicator } from "@/components/StatusIndicator";

/**
 * 404 page with cinematic down status indicator.
 */
export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center px-6 sm:px-12 lg:px-24 relative overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Background Texture */}
      <div className="absolute inset-0 zen-dot-matrix opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)] via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start gap-12">
        {/* Row 1: Status + 404 */}
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-down-muted blur-xl rounded-full animate-km-breathe-subtle" />
            <StatusIndicator status="down" size="xl" cinematic />
          </div>
          <h1 className="font-display text-8xl md:text-9xl text-[var(--color-text-primary)] tracking-tighter leading-none">
            404
          </h1>
        </div>

        {/* Row 2: Action */}
        <Link
          href="/"
          className="group relative inline-flex items-center justify-center px-6 py-3 border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-200 rounded-full"
        >
          <span className="font-mono text-sm text-[var(--color-text-primary)] group-hover:translate-x-0.5 transition-transform">
            Return Home
          </span>
        </Link>
      </div>
    </div>
  );
}
