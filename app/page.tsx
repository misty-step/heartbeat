import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { InkAtmosphere } from "@/components/InkAtmosphere";

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col hero-grid">
      {/* Background atmosphere */}
      <InkAtmosphere />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-12 lg:right-24 z-10">
        <ThemeToggle />
      </div>

      {/* Hero - Clean, focused */}
      <main className="min-h-dvh flex items-center px-6 sm:px-12 lg:px-24">
        <div>
          {/* Headline - two lines, left-aligned */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.2] tracking-tight text-foreground">
            <span className="block whitespace-nowrap">
              Your infrastructure,
            </span>
            <span className="block whitespace-nowrap italic text-[var(--color-text-tertiary)]">
              always in sight.
            </span>
          </h1>

          {/* Breathing room */}
          <div className="h-16 sm:h-20" />

          {/* Button - Moss + Stone Float */}
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-foreground text-background font-medium text-lg whitespace-nowrap shadow-[0_4px_12px_rgba(45,74,62,0.15)] hover:shadow-[0_6px_16px_rgba(45,74,62,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_6px_rgba(45,74,62,0.1)] transition-all duration-150"
          >
            Start Monitoring
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
