import { describe, expect, test } from "vitest";
import {
  computeIsItDownVerdict,
  getIsItDownSummary,
  normalizeTargetInput,
} from "../is-it-down";

describe("normalizeTargetInput", () => {
  test("normalizes bare hostnames to https probe urls", () => {
    expect(normalizeTargetInput("GitHub.com")).toEqual({
      hostname: "github.com",
      probeUrl: "https://github.com",
    });
  });

  test("accepts explicit https targets", () => {
    expect(normalizeTargetInput("https://status.openai.com/path")).toEqual({
      hostname: "status.openai.com",
      probeUrl: "https://status.openai.com",
    });
  });

  test("preserves explicit http scheme and port", () => {
    expect(normalizeTargetInput("http://service.example:8080/health")).toEqual({
      hostname: "service.example",
      probeUrl: "http://service.example:8080",
    });
  });

  test("rejects unsupported protocols", () => {
    expect(() => normalizeTargetInput("ftp://example.com")).toThrow(
      "Only http and https targets are supported",
    );
  });
});

describe("computeIsItDownVerdict", () => {
  test("returns no_data without samples", () => {
    expect(computeIsItDownVerdict({ samples: [] })).toBe("no_data");
  });

  test("returns likely_down_for_everyone for mostly-down recent probes", () => {
    const now = Date.now();
    expect(
      computeIsItDownVerdict({
        now,
        samples: [
          { status: "down", checkedAt: now - 1000, responseTime: 1000 },
          { status: "down", checkedAt: now - 2000, responseTime: 1000 },
          { status: "up", checkedAt: now - 3000, responseTime: 200 },
        ],
      }),
    ).toBe("likely_down_for_everyone");
  });

  test("returns likely_local_issue for mostly-up probes", () => {
    const now = Date.now();
    expect(
      computeIsItDownVerdict({
        now,
        samples: [
          { status: "up", checkedAt: now - 1000, responseTime: 120 },
          { status: "up", checkedAt: now - 2000, responseTime: 100 },
          { status: "down", checkedAt: now - 3000, responseTime: 1000 },
        ],
      }),
    ).toBe("likely_local_issue");
  });

  test("open incidents force likely_down_for_everyone", () => {
    const now = Date.now();
    expect(
      computeIsItDownVerdict({
        now,
        openIncidentCount: 1,
        samples: [{ status: "up", checkedAt: now - 1000, responseTime: 120 }],
      }),
    ).toBe("likely_down_for_everyone");
  });

  test("returns unclear_retrying for mixed recent probes", () => {
    const now = Date.now();
    expect(
      computeIsItDownVerdict({
        now,
        samples: [
          { status: "up", checkedAt: now - 1000, responseTime: 120 },
          { status: "down", checkedAt: now - 2000, responseTime: 900 },
        ],
      }),
    ).toBe("unclear_retrying");
  });
});

describe("getIsItDownSummary", () => {
  test("maps verdicts to short summaries", () => {
    expect(getIsItDownSummary("likely_local_issue", "example.com")).toContain(
      "reachable",
    );
    expect(
      getIsItDownSummary("likely_down_for_everyone", "example.com"),
    ).toContain("looks down");
    expect(getIsItDownSummary("no_data", "example.com")).toContain(
      "No probe data yet",
    );
  });
});
