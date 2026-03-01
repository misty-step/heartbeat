import Link from "next/link";

/**
 * Footer - Field Design System
 *
 * Site footer with brand, copyright, and navigation links.
 */
export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
      <div className="px-6 sm:px-12 lg:px-24 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand & Copyright */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-[var(--color-text-primary)] tracking-tight">
                Heartbeat
              </span>
              <span className="text-[var(--color-border-default)]">/</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                © 2026{" "}
                <a
                  href="https://mistystep.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Misty Step
                </a>
              </span>
            </div>
          </div>

          {/* Minimal Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[var(--color-text-tertiary)]">
            <Link
              href="/dashboard"
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/terms"
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Privacy
            </Link>
            <a
              href="mailto:hello@mistystep.io"
              className="hover:text-[var(--color-text-primary)] transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
