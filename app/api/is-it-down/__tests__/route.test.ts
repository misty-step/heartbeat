import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { TargetInputError } from "@/lib/domain";
import { getPublicIsItDownSnapshot } from "@/lib/public-is-it-down";
import { GET } from "../route";

vi.mock("@/lib/public-is-it-down", () => ({
  getPublicIsItDownSnapshot: vi.fn(),
}));

const mockedGetPublicIsItDownSnapshot = vi.mocked(getPublicIsItDownSnapshot);

function createRequest(target?: string) {
  const url = target
    ? `http://localhost:3000/api/is-it-down?target=${encodeURIComponent(target)}`
    : "http://localhost:3000/api/is-it-down";

  return new NextRequest(url);
}

describe("/api/is-it-down route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when target is missing", async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing target query parameter",
    });
  });

  it("returns snapshot payload for valid targets", async () => {
    mockedGetPublicIsItDownSnapshot.mockResolvedValue({
      hostname: "example.com",
      snapshot: {
        hostname: "example.com",
        probeUrl: "https://example.com",
        verdict: "likely_local_issue",
        summary: "example.com looks reachable from Heartbeat probes",
        recentChecks: [],
        recentSuccessCount: 0,
        recentFailureCount: 0,
        matchingPublicMonitors: [],
        activeIncidents: [],
      },
    });

    const response = await GET(createRequest("example.com"));

    expect(response.status).toBe(200);
    expect(mockedGetPublicIsItDownSnapshot).toHaveBeenCalledWith("example.com");
    await expect(response.json()).resolves.toMatchObject({
      hostname: "example.com",
      probeUrl: "https://example.com",
    });
  });

  it("maps target validation failures to 400", async () => {
    mockedGetPublicIsItDownSnapshot.mockRejectedValue(
      new TargetInputError("Only http and https targets are supported"),
    );

    const response = await GET(createRequest("ftp://example.com"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Only http and https targets are supported",
    });
  });

  it("returns a generic 500 for probe failures", async () => {
    mockedGetPublicIsItDownSnapshot.mockRejectedValue(
      new Error("Private IP addresses are not allowed"),
    );

    const response = await GET(createRequest("http://10.0.0.1"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Probe failed" });
  });
});
