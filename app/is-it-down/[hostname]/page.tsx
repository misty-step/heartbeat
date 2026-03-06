import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { BASE_URL } from "@/lib/constants";
import { fetchPublicQuery } from "@/lib/convex-public";
import { safeJsonLd } from "@/lib/json-ld";
import {
  IsItDownResultCard,
  type IsItDownSnapshot,
} from "@/components/IsItDownResultCard";

export const revalidate = 300;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ hostname: string }>;
}

const getSnapshot = cache(async (hostname: string) => {
  return await fetchPublicQuery(api.isItDown.getStatusForTarget, {
    target: hostname,
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hostname: string }>;
}): Promise<Metadata> {
  const { hostname } = await params;
  const normalized = hostname.toLowerCase().trim();

  try {
    const snapshot = await getSnapshot(normalized);
    return {
      title: `Is ${snapshot.hostname} down? — Heartbeat`,
      description: snapshot.summary,
      alternates: {
        canonical: `${BASE_URL}/is-it-down/${snapshot.hostname}`,
      },
    };
  } catch {
    return {
      title: "Is it down? — Heartbeat",
      description: "Check whether a service is down for everyone or just you.",
    };
  }
}

export async function generateStaticParams() {
  return [];
}

export default async function IsItDownTargetPage({ params }: PageProps) {
  const { hostname } = await params;
  const normalized = hostname.toLowerCase().trim();

  if (!normalized) {
    notFound();
  }

  let snapshot: IsItDownSnapshot;
  try {
    snapshot = await getSnapshot(normalized);
  } catch {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Is ${snapshot.hostname} down?`,
    description: snapshot.summary,
    url: `${BASE_URL}/is-it-down/${snapshot.hostname}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Heartbeat",
      url: BASE_URL,
    },
  };

  return (
    <main className="relative overflow-hidden py-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(90,150,128,0.14),transparent_38%),radial-gradient(circle_at_88%_18%,rgba(90,150,128,0.1),transparent_34%)]" />
      <div className="page-container relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />

        {/* Compact header — breadcrumb + headline + inline search */}
        <section className="mx-auto mb-5 max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <nav className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                <Link
                  href="/is-it-down"
                  className="font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)]"
                >
                  Is It Down
                </Link>
                <span>/</span>
                <span className="font-mono text-[13px]">
                  {snapshot.hostname}
                </span>
              </nav>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Is{" "}
                <span className="text-[var(--color-accent-primary)]">
                  {snapshot.hostname}
                </span>{" "}
                down?
              </h1>
            </div>

            {/* Inline check-another form — collapses to full-width on mobile */}
            <form
              action="/is-it-down"
              method="GET"
              className="flex w-full gap-2 sm:w-auto"
            >
              <input
                name="target"
                type="text"
                placeholder="Check another..."
                className="min-w-0 flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-accent-primary)] sm:w-48 sm:flex-initial"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-primary-hover)]"
              >
                Go
              </button>
            </form>
          </div>
        </section>

        {/* Result card — the whole story */}
        <section className="mx-auto max-w-5xl">
          <IsItDownResultCard snapshot={snapshot} compact />
        </section>
      </div>
    </main>
  );
}
