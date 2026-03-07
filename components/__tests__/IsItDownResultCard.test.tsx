import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import {
  IsItDownResultCard,
  type IsItDownSnapshot,
} from "@/components/IsItDownResultCard";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const BASE_TIME = Date.parse("2026-03-07T12:00:00.000Z");

function buildSnapshot(
  overrides: Partial<IsItDownSnapshot> = {},
): IsItDownSnapshot {
  return {
    hostname: "github.com",
    probeUrl: "https://github.com",
    verdict: "likely_down_for_everyone",
    summary: "github.com looks down for multiple checks",
    checkedAt: BASE_TIME,
    latestStatus: "down",
    recentChecks: [
      {
        status: "down",
        responseTime: 5000,
        checkedAt: BASE_TIME - 1000,
        source: "on_demand",
      },
      {
        status: "up",
        statusCode: 200,
        responseTime: 130,
        checkedAt: BASE_TIME - 2000,
        source: "scheduled",
      },
      {
        status: "up",
        statusCode: 200,
        responseTime: 145,
        checkedAt: BASE_TIME - 3000,
        source: "scheduled",
      },
    ],
    recentSuccessCount: 2,
    recentFailureCount: 1,
    matchingPublicMonitors: [
      {
        monitorId: "monitor_1",
        name: "GitHub API",
        status: "down",
        statusSlug: "github-api",
      },
      {
        monitorId: "monitor_2",
        name: "No Public Link",
        status: "up",
      },
    ],
    activeIncidents: [
      {
        incidentId: "incident_1",
        monitorId: "monitor_1",
        monitorName: "GitHub API",
        title: "API outage",
        startedAt: BASE_TIME - 60_000,
      },
    ],
    ...overrides,
  };
}

describe("IsItDownResultCard", () => {
  test("renders full diagnostic view with verdict and context panels", () => {
    const snapshot = buildSnapshot();
    render(<IsItDownResultCard snapshot={snapshot} />);

    expect(screen.getByText("Diagnostic result")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: snapshot.hostname }),
    ).toBeInTheDocument();
    expect(screen.getByText("Likely Down For Everyone")).toBeInTheDocument();
    expect(screen.getByText(snapshot.summary)).toBeInTheDocument();
    expect(screen.getByText(/^Checked /)).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Open target URL" }),
    ).toHaveAttribute("href", snapshot.probeUrl);
    expect(
      screen.getByRole("link", { name: /Start with Heartbeat/i }),
    ).toHaveAttribute("href", "/sign-up");

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getByText("timeout")).toBeInTheDocument();
    expect(screen.getByText("API outage")).toBeInTheDocument();

    const statusPageLink = screen.getByRole("link", { name: "GitHub API" });
    expect(statusPageLink).toHaveAttribute("href", "/status/github-api");
    expect(
      screen.queryByRole("link", { name: "No Public Link" }),
    ).not.toBeInTheDocument();
  });

  test("renders compact mode without hostname heading block", () => {
    const snapshot = buildSnapshot({
      verdict: "likely_local_issue",
      summary: "Heartbeat probes can reach github.com",
    });

    render(<IsItDownResultCard snapshot={snapshot} compact />);

    expect(screen.queryByText("Diagnostic result")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: snapshot.hostname }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Likely Local Issue")).toBeInTheDocument();
    expect(screen.getByText(snapshot.summary)).toBeInTheDocument();
  });

  test("caps probe strip bars to the 13 most recent checks", () => {
    const recentChecks = Array.from({ length: 16 }, (_, index) => ({
      status: index % 3 === 0 ? ("down" as const) : ("up" as const),
      responseTime: 100 + index,
      checkedAt: BASE_TIME - index * 1000,
      source: "scheduled" as const,
    }));

    const { container } = render(
      <IsItDownResultCard
        snapshot={buildSnapshot({
          recentChecks,
          activeIncidents: [],
          matchingPublicMonitors: [],
        })}
      />,
    );

    expect(container.querySelectorAll("[title]").length).toBe(13);
  });

  test("shows no-data and empty network context states", () => {
    const snapshot = buildSnapshot({
      verdict: "no_data",
      checkedAt: undefined,
      recentChecks: [],
      recentSuccessCount: 0,
      recentFailureCount: 0,
      matchingPublicMonitors: [],
      activeIncidents: [],
    });

    const { container } = render(<IsItDownResultCard snapshot={snapshot} />);

    expect(screen.getByText("No Data Yet")).toBeInTheDocument();
    expect(screen.getByText("Awaiting first probe sample")).toBeInTheDocument();
    expect(
      screen.getByText(
        /No active incidents or linked status pages for this hostname/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Linked Status Pages")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[title]").length).toBe(0);
  });
});
