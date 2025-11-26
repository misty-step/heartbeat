import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-text-primary">
            Set and forget uptime monitoring
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            Monitor your services with beautiful status pages and real-time alerts.
            Simple, reliable, and built for developers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-text-primary text-background rounded-lg hover:opacity-90 transition-opacity font-medium text-lg"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="px-6 py-3 bg-surface text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium text-lg border border-border"
          >
            Learn More
          </Link>
        </div>

        <div id="features" className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              Beautiful Status Pages
            </h3>
            <p className="text-sm text-text-secondary">
              Public status pages your customers will trust. Real-time updates, historical uptime, and incident timeline.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              Reliable Monitoring
            </h3>
            <p className="text-sm text-text-secondary">
              HTTP checks every 1-5 minutes with smart failure detection. Get notified when it matters.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              Simple Setup
            </h3>
            <p className="text-sm text-text-secondary">
              Add a monitor, get a status page. No complex configuration, no hidden costs. Just monitoring that works.
            </p>
          </div>
        </div>

        <div className="pt-8 text-sm text-text-tertiary">
          <p>
            Built with Next.js, Convex, and ❤️ by developers, for developers.
          </p>
        </div>
      </div>
    </div>
  );
}
