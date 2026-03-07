import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { BASE_URL } from "@/lib/constants";
import { fetchPublicQuery } from "@/lib/convex-public";
import { safeJsonLd } from "@/lib/json-ld";
import {
  IsItDownResultCard,
  type IsItDownSnapshot,
} from "@/components/IsItDownResultCard";
import { getPublicIsItDownSnapshot } from "@/lib/public-is-it-down";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Is It Down? Instant Uptime Check — Heartbeat",
  description:
    "Check if a website is down for everyone or just you. Instant probe results plus public incident context from Heartbeat.",
  alternates: {
    canonical: `${BASE_URL}/is-it-down`,
  },
};

interface PageProps {
  searchParams: Promise<{ target?: string }>;
}

export default async function IsItDownPage({ searchParams }: PageProps) {
  const { target } = await searchParams;
  const inputTarget = (target ?? "").trim();

  const trackedTargets = await fetchPublicQuery(
    api.isItDown.listTrackedTargets,
    {},
  );

  let snapshot: IsItDownSnapshot | null = null;
  let errorMessage: string | null = null;
  let parsedHostname: string | null = null;

  if (inputTarget) {
    try {
      const result = await getPublicIsItDownSnapshot(inputTarget);
      parsedHostname = result.hostname;
      snapshot = result.snapshot;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Probe failed";
      errorMessage = message;
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Heartbeat Is It Down",
    description:
      "Check whether a service is down for everyone or just your connection.",
    url: `${BASE_URL}/is-it-down`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
  };

  // Dynamic headline: "Is github.com down?" or generic "Is it down?"
  const headlineTarget = parsedHostname ?? "it";
  const showTargetInHeadline = !!parsedHostname;

  return (
    <main className="relative overflow-hidden py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(90,150,128,0.14),transparent_38%),radial-gradient(circle_at_90%_18%,rgba(90,150,128,0.12),transparent_34%)]" />
      <div className="page-container relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />

        {/* Hero diagnostic card */}
        <section className="mx-auto max-w-5xl">
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-md)] sm:p-12">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Heartbeat Labs
              </p>
              <span className="size-1 animate-km-breathe rounded-full bg-[var(--color-accent-primary)]" />
            </div>

            <h1 className="mt-3 text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
              Is{" "}
              {showTargetInHeadline ? (
                <span className="text-[var(--color-accent-primary)]">
                  {headlineTarget}
                </span>
              ) : (
                "it"
              )}{" "}
              down?
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[var(--color-text-secondary)]">
              Three Heartbeat probes, incident context from the network, and a
              deterministic verdict.
            </p>

            <form action="/is-it-down" method="GET" className="mt-7">
              <label htmlFor="target" className="sr-only">
                Domain or URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="target"
                  name="target"
                  type="text"
                  defaultValue={inputTarget}
                  placeholder="github.com"
                  className="w-full rounded-[14px] border-[1.5px] border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-[18px] py-3.5 text-base shadow-[var(--shadow-sm)] outline-none transition focus:border-[var(--color-accent-primary)] sm:max-w-md"
                />
                <button
                  type="submit"
                  className="rounded-[14px] bg-[var(--color-accent-primary)] px-7 py-3.5 text-[15px] font-bold text-white transition hover:bg-[var(--color-accent-primary-hover)]"
                >
                  Check now
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {["3 probes", "Incident context", "Evidence-based verdict"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3.5 py-1.5 text-xs text-[var(--color-text-muted)]"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>

            {errorMessage && (
              <p className="mt-5 rounded-[14px] border border-[var(--color-status-down)]/30 bg-[var(--color-status-down-muted)] px-4 py-3 text-sm text-[var(--color-status-down)]">
                {errorMessage}
              </p>
            )}
          </div>
        </section>

        {/* Result */}
        {snapshot && (
          <section className="mx-auto mt-7 max-w-5xl animate-km-fade-in-up">
            <IsItDownResultCard snapshot={snapshot} />
          </section>
        )}

        {/* Popular checks */}
        {!snapshot && (
          <section className="mx-auto mt-12 max-w-5xl">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Popular checks
              </h2>
              <Link
                href="/sign-up"
                className="text-[13px] font-semibold text-[var(--color-accent-primary)] hover:underline"
              >
                Monitor your own &rarr;
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trackedTargets.map(
                (item: { hostname: string; label: string }) => (
                  <Link
                    key={item.hostname}
                    href={`/is-it-down/${item.hostname}`}
                    className="card-hover rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-5 py-5 shadow-[var(--shadow-sm)]"
                  >
                    <p className="text-[15px] font-semibold">{item.label}</p>
                    <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">
                      {item.hostname}
                    </p>
                  </Link>
                ),
              )}
            </div>
          </section>
        )}

        {/* Conversion CTA — only show when no result (result card has its own CTA) */}
        {!snapshot && (
          <section className="mx-auto mt-12 max-w-5xl">
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-sm)] sm:p-10">
              <h3 className="text-2xl font-extrabold tracking-tight">
                Go from one check to continuous reliability
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Create monitor",
                    body: "Track your URL every minute with three-strike logic.",
                  },
                  {
                    title: "Get alerts",
                    body: "Receive notifications only when issues are real.",
                  },
                  {
                    title: "Share status",
                    body: "Publish a status page your users can trust.",
                  },
                ].map((step) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="rounded-full bg-[var(--color-accent-primary)] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-accent-primary-hover)]"
                >
                  Start 14-day trial
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full border border-[var(--color-border-default)] px-7 py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-secondary)]"
                >
                  View plans
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
