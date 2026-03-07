import Link from "next/link";

type ProbeItem = {
  status: "up" | "down";
  statusCode?: number;
  responseTime: number;
  errorMessage?: string;
  checkedAt: number;
  source: "scheduled" | "on_demand";
};

export type IsItDownSnapshot = {
  hostname: string;
  probeUrl: string;
  verdict:
    | "likely_down_for_everyone"
    | "likely_local_issue"
    | "unclear_retrying"
    | "no_data";
  summary: string;
  checkedAt?: number;
  latestStatus?: "up" | "down";
  recentChecks: ProbeItem[];
  recentSuccessCount: number;
  recentFailureCount: number;
  matchingPublicMonitors: {
    monitorId: string;
    name: string;
    status: "up" | "degraded" | "down";
    statusSlug?: string;
  }[];
  activeIncidents: {
    incidentId: string;
    monitorId: string;
    monitorName: string;
    title: string;
    startedAt: number;
  }[];
};

function getVerdictPresentation(verdict: IsItDownSnapshot["verdict"]): {
  label: string;
  dotClass: string;
  badgeClass: string;
} {
  switch (verdict) {
    case "likely_down_for_everyone":
      return {
        label: "Likely Down For Everyone",
        dotClass: "bg-[var(--color-status-down)]",
        badgeClass:
          "bg-[var(--color-status-down-muted)] text-[var(--color-status-down)] border-[var(--color-status-down)]/30",
      };
    case "likely_local_issue":
      return {
        label: "Likely Local Issue",
        dotClass: "bg-[var(--color-status-up)]",
        badgeClass:
          "bg-[var(--color-status-up-muted)] text-[var(--color-status-up)] border-[var(--color-status-up)]/30",
      };
    case "unclear_retrying":
      return {
        label: "Unclear, Retrying",
        dotClass: "bg-[var(--color-status-degraded)]",
        badgeClass:
          "bg-[var(--color-status-degraded-muted)] text-[var(--color-status-degraded)] border-[var(--color-status-degraded)]/30",
      };
    case "no_data":
      return {
        label: "No Data Yet",
        dotClass: "bg-[var(--color-text-muted)]",
        badgeClass:
          "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-default)]",
      };
  }
}

function formatProbeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Bar visualization of recent probes — height = normalized response time, color = status */
function ProbeStrip({ checks }: { checks: ProbeItem[] }) {
  if (checks.length === 0) return null;
  const ordered = checks.slice(0, 13).reverse();
  // Use a tighter floor so similar response times still show variation
  const times = ordered.map((c) => c.responseTime || 50);
  const maxTime = Math.max(...times, 100);
  const minTime = Math.min(...times);
  const range = maxTime - minTime || 1;

  return (
    <div className="flex items-end gap-[3px]" style={{ height: 36 }}>
      {ordered.map((check, i) => {
        // Down probes always full height; up probes scaled relative to range
        const normalized =
          check.status === "down"
            ? 100
            : 25 + ((times[i] - minTime) / range) * 75;
        const bg =
          check.status === "down"
            ? "bg-[var(--color-status-down)]/50"
            : "bg-[var(--color-status-up)]/30";
        return (
          <div
            key={`${check.checkedAt}-${i}`}
            className={`flex-1 rounded-t-[2px] ${bg}`}
            style={{ height: `${normalized}%` }}
            title={`${check.status === "up" ? "Up" : "Down"} — ${check.responseTime}ms`}
          />
        );
      })}
    </div>
  );
}

interface IsItDownResultCardProps {
  snapshot: IsItDownSnapshot;
  /** Hide the large hostname header (when page already shows it) */
  compact?: boolean;
}

export function IsItDownResultCard({
  snapshot,
  compact,
}: IsItDownResultCardProps) {
  const verdict = getVerdictPresentation(snapshot.verdict);
  const hasIncidents = snapshot.activeIncidents.length > 0;
  const hasMonitorLinks = snapshot.matchingPublicMonitors.some(
    (monitor) => monitor.statusSlug,
  );
  const hasContext = hasIncidents || hasMonitorLinks;

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)]">
      {/* Verdict header */}
      <div
        className={`flex flex-wrap items-start justify-between gap-4 ${compact ? "px-6 py-5 sm:px-8" : "p-6 sm:p-8 sm:pb-6"}`}
      >
        <div className="min-w-0 flex-1">
          {!compact && (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Diagnostic result
              </p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {snapshot.hostname}
              </h2>
            </>
          )}
          <p
            className={`max-w-md text-[15px] leading-relaxed text-[var(--color-text-secondary)] ${compact ? "" : "mt-2"}`}
          >
            {snapshot.summary}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-[var(--color-text-muted)]">
            {snapshot.checkedAt
              ? `Checked ${formatProbeTime(snapshot.checkedAt)}`
              : "Awaiting first probe sample"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${verdict.badgeClass}`}
          >
            <span className={`size-2 rounded-full ${verdict.dotClass}`} />
            {verdict.label}
          </span>
          <a
            href={snapshot.probeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-semibold text-[var(--color-accent-primary)] hover:underline"
          >
            Open target URL
          </a>
        </div>
      </div>

      {/* Probe strip */}
      {snapshot.recentChecks.length > 0 && (
        <div className="px-6 pb-4 sm:px-8">
          <ProbeStrip checks={snapshot.recentChecks} />
        </div>
      )}

      {/* Stats row — divided cells */}
      <div className="grid grid-cols-3 border-t border-[var(--color-border-subtle)]">
        <div className="px-4 py-4 text-center sm:px-8">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Successes
          </div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">
            {snapshot.recentSuccessCount}
          </div>
        </div>
        <div className="border-x border-[var(--color-border-subtle)] px-4 py-4 text-center sm:px-8">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Failures
          </div>
          <div
            className={`mt-1 text-2xl font-extrabold tabular-nums ${snapshot.recentFailureCount > 0 ? "text-[var(--color-status-down)]" : ""}`}
          >
            {snapshot.recentFailureCount}
          </div>
        </div>
        <div className="px-4 py-4 text-center sm:px-8">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Active Incidents
          </div>
          <div
            className={`mt-1 text-2xl font-extrabold tabular-nums ${snapshot.activeIncidents.length > 0 ? "text-[var(--color-status-down)]" : ""}`}
          >
            {snapshot.activeIncidents.length}
          </div>
        </div>
      </div>

      {/* Evidence panels — 2-col grid */}
      <div className="grid gap-3 border-t border-[var(--color-border-subtle)] p-5 sm:p-6 lg:grid-cols-2">
        {/* Left: Probe log — show 3 most recent */}
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
          <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
            Latest Probes
          </p>
          <div className="mt-3 space-y-1.5">
            {snapshot.recentChecks.slice(0, 3).map((check, index) => (
              <div
                key={`${check.checkedAt}-${check.responseTime}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2"
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${check.status === "up" ? "bg-[var(--color-status-up)]" : "bg-[var(--color-status-down)]"}`}
                />
                <span className="text-[13px] font-semibold">
                  {check.status === "up" ? "Up" : "Down"}
                </span>
                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                  {check.statusCode ??
                    (check.status === "down"
                      ? (check.errorMessage ?? "error")
                      : "")}
                </span>
                <span className="ml-auto font-mono text-[11px] text-[var(--color-text-muted)]">
                  {check.responseTime}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Incidents + Status pages */}
        <div className="space-y-3">
          {/* Incident context — only render panel if there are incidents */}
          {hasIncidents ? (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                Active Incidents
              </p>
              <div className="mt-2 space-y-1.5">
                {snapshot.activeIncidents.map((incident) => (
                  <div
                    key={incident.incidentId}
                    className="rounded-lg border border-[var(--color-status-down)]/15 bg-[var(--color-status-down-muted)] px-3.5 py-2.5"
                  >
                    <p className="text-[13px] font-semibold">
                      {incident.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {incident.monitorName} &middot; Started{" "}
                      {formatShortTime(incident.startedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Status page links */}
          {hasMonitorLinks ? (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                Linked Status Pages
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.matchingPublicMonitors
                  .filter((monitor) => monitor.statusSlug)
                  .map((monitor) => (
                    <Link
                      key={monitor.monitorId}
                      href={`/status/${monitor.statusSlug}`}
                      className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3.5 py-1.5 text-xs font-semibold transition hover:border-[var(--color-accent-primary)]"
                    >
                      {monitor.name}
                    </Link>
                  ))}
              </div>
            </div>
          ) : null}

          {/* Empty state — only if no incidents AND no status pages */}
          {!hasContext && (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                Network Context
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                No active incidents or linked status pages for this hostname on
                the Heartbeat network.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-6 py-3.5 sm:px-8">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Convert this check into continuous monitoring
        </p>
        <Link
          href="/sign-up"
          className="text-[13px] font-bold text-[var(--color-accent-primary)] hover:underline"
        >
          Start with Heartbeat &rarr;
        </Link>
      </div>
    </div>
  );
}
