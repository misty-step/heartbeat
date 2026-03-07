import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import IsItDownPage, { dynamic, metadata } from "../page";
import { TargetInputError } from "@/lib/domain";

const pageMocks = vi.hoisted(() => ({
  fetchPublicQuery: vi.fn(),
  getPublicIsItDownSnapshot: vi.fn(),
  captureSnapshot: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  api: {
    isItDown: {
      listTrackedTargets: "isItDown.listTrackedTargets",
      getLatestProbeForTarget: "isItDown.getLatestProbeForTarget",
      getStatusForTarget: "isItDown.getStatusForTarget",
      probePublicTarget: "isItDown.probePublicTarget",
    },
  },
}));

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

vi.mock("@/lib/convex-public", () => ({
  fetchPublicQuery: pageMocks.fetchPublicQuery,
}));

vi.mock("@/lib/public-is-it-down", () => ({
  getPublicIsItDownSnapshot: pageMocks.getPublicIsItDownSnapshot,
}));

vi.mock("@/convex/_generated/api", () => ({
  api: apiMocks.api,
}));

vi.mock("@/components/IsItDownResultCard", () => ({
  IsItDownResultCard: ({ snapshot }: { snapshot: { hostname: string } }) => {
    pageMocks.captureSnapshot(snapshot);
    return <div data-testid="result-card">Result for {snapshot.hostname}</div>;
  },
}));

const trackedTargets = [
  { hostname: "github.com", label: "GitHub" },
  { hostname: "openai.com", label: "OpenAI" },
];

function buildSnapshot(hostname = "github.com") {
  return {
    hostname,
    probeUrl: `https://${hostname}`,
    verdict: "likely_local_issue",
    summary: `${hostname} looks reachable from Heartbeat probes`,
    checkedAt: Date.now(),
    latestStatus: "up",
    recentChecks: [],
    recentSuccessCount: 3,
    recentFailureCount: 0,
    matchingPublicMonitors: [],
    activeIncidents: [],
  };
}

describe("app/is-it-down/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("exports expected dynamic rendering config and metadata", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(metadata.alternates?.canonical).toBe(
      "https://heartbeat.cool/is-it-down",
    );
  });

  test("renders popular checks and CTA when no target is provided", async () => {
    pageMocks.fetchPublicQuery.mockResolvedValueOnce(trackedTargets);

    const ui = await IsItDownPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /is\s*it\s*down\?/i,
    );
    expect(screen.getByText("Popular checks")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /GitHub github\.com/i }),
    ).toHaveAttribute("href", "/is-it-down/github.com");
    expect(
      screen.getByRole("link", { name: /OpenAI openai\.com/i }),
    ).toHaveAttribute("href", "/is-it-down/openai.com");
    expect(
      screen.getByText("Go from one check to continuous reliability"),
    ).toBeInTheDocument();

    expect(pageMocks.fetchPublicQuery).toHaveBeenCalledTimes(1);
    expect(pageMocks.fetchPublicQuery).toHaveBeenCalledWith(
      apiMocks.api.isItDown.listTrackedTargets,
      {},
    );
    expect(pageMocks.getPublicIsItDownSnapshot).not.toHaveBeenCalled();
    expect(screen.queryByTestId("result-card")).not.toBeInTheDocument();
  });

  test("uses cached fresh probe data and renders result card", async () => {
    const snapshot = buildSnapshot("github.com");
    pageMocks.fetchPublicQuery.mockResolvedValueOnce(trackedTargets);
    pageMocks.getPublicIsItDownSnapshot.mockResolvedValueOnce({
      hostname: "github.com",
      snapshot,
    });

    const ui = await IsItDownPage({
      searchParams: Promise.resolve({ target: "  GitHub.com  " }),
    });
    render(ui);

    expect(pageMocks.fetchPublicQuery).toHaveBeenNthCalledWith(
      1,
      apiMocks.api.isItDown.listTrackedTargets,
      {},
    );
    expect(pageMocks.getPublicIsItDownSnapshot).toHaveBeenCalledWith(
      "GitHub.com",
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /is\s*github\.com\s*down\?/i,
    );
    expect(screen.getByTestId("result-card")).toHaveTextContent(
      "Result for github.com",
    );
    expect(screen.queryByText("Popular checks")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Go from one check to continuous reliability"),
    ).not.toBeInTheDocument();
  });

  test("renders result card when snapshot helper resolves", async () => {
    const snapshot = buildSnapshot("openai.com");
    pageMocks.fetchPublicQuery.mockResolvedValueOnce(trackedTargets);
    pageMocks.getPublicIsItDownSnapshot.mockResolvedValueOnce({
      hostname: "openai.com",
      snapshot,
    });

    const ui = await IsItDownPage({
      searchParams: Promise.resolve({ target: "openai.com" }),
    });
    render(ui);

    expect(pageMocks.getPublicIsItDownSnapshot).toHaveBeenCalledWith(
      "openai.com",
    );
    expect(screen.getByTestId("result-card")).toHaveTextContent(
      "Result for openai.com",
    );
  });

  test("shows validation errors and preserves popular checks block", async () => {
    pageMocks.fetchPublicQuery.mockResolvedValueOnce(trackedTargets);
    pageMocks.getPublicIsItDownSnapshot.mockImplementationOnce(() => {
      throw new TargetInputError("Only http and https targets are supported");
    });

    const ui = await IsItDownPage({
      searchParams: Promise.resolve({ target: "ftp://github.com" }),
    });
    render(ui);

    expect(
      screen.getByText("Only http and https targets are supported"),
    ).toBeInTheDocument();
    expect(screen.getByText("Popular checks")).toBeInTheDocument();
    expect(pageMocks.fetchPublicQuery).toHaveBeenCalledTimes(1);
    expect(pageMocks.getPublicIsItDownSnapshot).toHaveBeenCalledWith(
      "ftp://github.com",
    );
    expect(screen.queryByTestId("result-card")).not.toBeInTheDocument();
  });

  test("masks operational probe failures behind generic copy", async () => {
    pageMocks.fetchPublicQuery.mockResolvedValueOnce(trackedTargets);
    pageMocks.getPublicIsItDownSnapshot.mockImplementationOnce(() => {
      throw new Error("socket hang up");
    });

    const ui = await IsItDownPage({
      searchParams: Promise.resolve({ target: "github.com" }),
    });
    render(ui);

    expect(screen.getByText("Probe failed")).toBeInTheDocument();
    expect(screen.queryByText("socket hang up")).not.toBeInTheDocument();
  });
});
