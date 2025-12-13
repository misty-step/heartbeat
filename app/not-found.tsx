import Link from "next/link";
import { StatusIndicator } from "@/components/StatusIndicator";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center px-6 sm:px-12 lg:px-24 relative overflow-hidden bg-background">
      {/* Enhanced Background Texture */}
      <div className="absolute inset-0 hero-grid opacity-[0.35] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 30%, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start gap-12">
        {/* Row 1: Status + 404 */}
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
            <StatusIndicator status="down" size="xl" cinematic />
          </div>
          <h1 className="text-display text-8xl md:text-9xl text-foreground tracking-tighter leading-none">
            404
          </h1>
        </div>

        {/* Row 2: Action */}
        <Link
          href="/"
          className="group relative inline-flex items-center justify-center px-6 py-3 border border-foreground/10 hover:border-foreground/30 bg-surface hover:bg-surface-elevated transition-all duration-200"
        >
          <span className="font-mono text-sm text-foreground group-hover:translate-x-0.5 transition-transform">
            Return Home
          </span>
        </Link>
      </div>
    </div>
  );
}
