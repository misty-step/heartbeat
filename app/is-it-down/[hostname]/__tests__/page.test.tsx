import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import IsItDownTargetPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
  revalidate,
} from "../page";

const targetPageMocks = vi.hoisted(() => ({
  fetchPublicQuery: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  captureSnapshot: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  api: {
    isItDown: {
      getStatusForTarget: "isItDown.getStatusForTarget",
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

vi.mock("next/navigation", () => ({
  notFound: targetPageMocks.notFound,
}));

vi.mock("@/lib/convex-public", () => ({
  fetchPublicQuery: targetPageMocks.fetchPublicQuery,
}));

vi.mock("@/convex/_generated/api", () => ({
  api: apiMocks.api,
}));

vi.mock("@/components/IsItDownResultCard", () => ({
  IsItDownResultCard: ({
    snapshot,
    compact,
  }: {
    snapshot: { hostname: string };
    compact?: boolean;
  }) => {
    targetPageMocks.captureSnapshot({ snapshot, compact });
    return (
      <div data-compact={compact ? "true" : "false"} data-testid="result-card">
        {snapshot.hostname}
      </div>
    );
  },
}));

function buildSnapshot(hostname: string) {
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

describe("app/is-it-down/[hostname]/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("exports static route config", async () => {
    expect(revalidate).toBe(300);
    expect(dynamicParams).toBe(true);
    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  test("generateMetadata returns hostname-specific values when snapshot resolves", async () => {
    const snapshot = buildSnapshot("github.com");
    targetPageMocks.fetchPublicQuery.mockResolvedValueOnce(snapshot);

    const result = await generateMetadata({
      params: Promise.resolve({ hostname: "GitHub.COM" }),
    });

    expect(targetPageMocks.fetchPublicQuery).toHaveBeenCalledWith(
      apiMocks.api.isItDown.getStatusForTarget,
      { target: "github.com" },
    );
    expect(result.title).toBe("Is github.com down? — Heartbeat");
    expect(result.description).toBe(snapshot.summary);
    expect(result.alternates?.canonical).toBe(
      "https://heartbeat.cool/is-it-down/github.com",
    );
  });

  test("generateMetadata falls back to generic copy on query failure", async () => {
    targetPageMocks.fetchPublicQuery.mockRejectedValueOnce(new Error("boom"));

    const result = await generateMetadata({
      params: Promise.resolve({ hostname: "no-data.example" }),
    });

    expect(result.title).toBe("Is it down? — Heartbeat");
    expect(result.description).toBe(
      "Check whether a service is down for everyone or just you.",
    );
  });

  test("renders target page and passes compact mode to result card", async () => {
    const snapshot = buildSnapshot("status.openai.com");
    targetPageMocks.fetchPublicQuery.mockResolvedValueOnce(snapshot);

    const ui = await IsItDownTargetPage({
      params: Promise.resolve({ hostname: "Status.OpenAI.com" }),
    });
    render(ui);

    expect(targetPageMocks.fetchPublicQuery).toHaveBeenCalledWith(
      apiMocks.api.isItDown.getStatusForTarget,
      { target: "status.openai.com" },
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /is\s*status\.openai\.com\s*down\?/i,
    );
    expect(screen.getByRole("link", { name: "Is It Down" })).toHaveAttribute(
      "href",
      "/is-it-down",
    );
    expect(screen.getByPlaceholderText("Check another...")).toBeInTheDocument();

    const resultCard = screen.getByTestId("result-card");
    expect(resultCard).toHaveTextContent("status.openai.com");
    expect(resultCard).toHaveAttribute("data-compact", "true");
  });

  test("calls notFound for empty hostname params", async () => {
    await expect(
      IsItDownTargetPage({
        params: Promise.resolve({ hostname: "   " }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(targetPageMocks.notFound).toHaveBeenCalledTimes(1);
    expect(targetPageMocks.fetchPublicQuery).not.toHaveBeenCalled();
  });

  test("calls notFound when snapshot query fails", async () => {
    targetPageMocks.fetchPublicQuery.mockRejectedValueOnce(new Error("nope"));

    await expect(
      IsItDownTargetPage({
        params: Promise.resolve({ hostname: "missing.example" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(targetPageMocks.notFound).toHaveBeenCalledTimes(1);
  });
});
