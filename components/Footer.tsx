import Link from "next/link";
import { StatusIndicator } from "@/components/StatusIndicator";

export function Footer() {
  return (
    <footer className="w-full border-t border-border footer-bg">
      <div className="px-6 sm:px-12 lg:px-24 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand & Copyright */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="font-serif font-bold text-foreground tracking-tight">
                Heartbeat
              </span>
              <span className="text-foreground/20">/</span>
              <span className="text-xs text-foreground/50 font-mono">
                © 2025 Misty Step
              </span>
            </div>
          </div>

          {/* Minimal Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-foreground/60">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <a
              href="mailto:hello@mistystep.io"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
