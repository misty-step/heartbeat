import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-6 sm:px-12 lg:px-24 py-8 border-t border-foreground/10 footer-bg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-foreground/50">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>© 2025 Heartbeat</span>
          <span className="hidden sm:inline">·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span className="hidden sm:inline">·</span>
          <a
            href="mailto:hello@mistystep.io"
            className="hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>

        <a
          href="https://mistystep.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          A Misty Step Project
        </a>
      </div>
    </footer>
  );
}
