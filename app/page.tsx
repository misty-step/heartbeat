import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col hero-grid">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-12 lg:right-24">
        <ThemeToggle />
      </div>

      {/* Hero - Clean, focused */}
      <main className="flex-1 flex items-center px-6 sm:px-12 lg:px-24">
        <div className="max-w-2xl">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-foreground">
            Your infrastructure,
            <br />
            <span className="italic">always in sight.</span>
          </h1>

          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 mt-10 px-8 py-4 bg-foreground text-background font-medium text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-up-glow)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-up-glow)]"></span>
            </span>
            Start Monitoring
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
