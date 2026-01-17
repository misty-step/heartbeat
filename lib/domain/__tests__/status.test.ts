import { describe, it, expect } from "vitest";
import {
  computeStatus,
  aggregateStatuses,
  getStatusLabel,
  getStatusHeadline,
  calculateApdex,
  getNaturalStatusMessage,
  type MonitorStatus,
} from "../status";

describe("computeStatus", () => {
  it('returns "up" for 0 consecutive failures', () => {
    expect(computeStatus(0)).toBe("up");
  });

  it('returns "degraded" for 1 consecutive failure', () => {
    expect(computeStatus(1)).toBe("degraded");
  });

  it('returns "degraded" for 2 consecutive failures', () => {
    expect(computeStatus(2)).toBe("degraded");
  });

  it('returns "down" for 3 consecutive failures', () => {
    expect(computeStatus(3)).toBe("down");
  });

  it('returns "down" for more than 3 consecutive failures', () => {
    expect(computeStatus(5)).toBe("down");
    expect(computeStatus(10)).toBe("down");
    expect(computeStatus(100)).toBe("down");
  });
});

describe("aggregateStatuses", () => {
  it('returns "up" for empty array', () => {
    expect(aggregateStatuses([])).toBe("up");
  });

  it('returns "up" when all monitors are up', () => {
    expect(aggregateStatuses(["up", "up", "up"])).toBe("up");
  });

  it('returns "degraded" when at least one monitor is degraded and none are down', () => {
    expect(aggregateStatuses(["up", "degraded", "up"])).toBe("degraded");
    expect(aggregateStatuses(["degraded", "degraded"])).toBe("degraded");
  });

  it('returns "down" when at least one monitor is down', () => {
    expect(aggregateStatuses(["up", "down", "up"])).toBe("down");
    expect(aggregateStatuses(["degraded", "down"])).toBe("down");
    expect(aggregateStatuses(["down", "down", "down"])).toBe("down");
  });

  it("prioritizes down over degraded", () => {
    expect(aggregateStatuses(["degraded", "down", "up"])).toBe("down");
  });
});

describe("getStatusLabel", () => {
  it('returns "Operational" for up status', () => {
    expect(getStatusLabel("up")).toBe("Operational");
  });

  it('returns "Degraded" for degraded status', () => {
    expect(getStatusLabel("degraded")).toBe("Degraded");
  });

  it('returns "Down" for down status', () => {
    expect(getStatusLabel("down")).toBe("Down");
  });
});

describe("getStatusHeadline", () => {
  it('returns "All Systems Operational" for up status', () => {
    expect(getStatusHeadline("up")).toBe("All Systems Operational");
  });

  it('returns "Partial Degradation" for degraded status', () => {
    expect(getStatusHeadline("degraded")).toBe("Partial Degradation");
  });

  it('returns "System Issues Detected" for down status', () => {
    expect(getStatusHeadline("down")).toBe("System Issues Detected");
  });

  it('returns "Status Unknown" for null', () => {
    expect(getStatusHeadline(null)).toBe("Status Unknown");
  });
});

describe("calculateApdex", () => {
  it("returns perfect score (1.0) for empty array", () => {
    const result = calculateApdex([]);
    expect(result.score).toBe(1);
    expect(result.rating).toBe("excellent");
    expect(result.total).toBe(0);
  });

  it("returns excellent rating for fast responses", () => {
    const result = calculateApdex([50, 100, 150, 180, 199]);
    expect(result.satisfied).toBe(5);
    expect(result.tolerating).toBe(0);
    expect(result.frustrated).toBe(0);
    expect(result.score).toBe(1);
    expect(result.rating).toBe("excellent");
  });

  it("calculates tolerating correctly (between 200ms and 1000ms)", () => {
    const result = calculateApdex([300, 500, 700, 900]);
    expect(result.satisfied).toBe(0);
    expect(result.tolerating).toBe(4);
    expect(result.frustrated).toBe(0);
    expect(result.score).toBe(0.5); // (0 + 4/2) / 4
    expect(result.rating).toBe("poor");
  });

  it("calculates frustrated correctly (>1000ms)", () => {
    const result = calculateApdex([1500, 2000, 3000, 5000]);
    expect(result.satisfied).toBe(0);
    expect(result.tolerating).toBe(0);
    expect(result.frustrated).toBe(4);
    expect(result.score).toBe(0);
    expect(result.rating).toBe("unacceptable");
  });

  it("calculates mixed scenarios correctly", () => {
    // 5 satisfied, 3 tolerating, 2 frustrated
    // Score = (5 + 3/2) / 10 = 6.5/10 = 0.65
    const result = calculateApdex([
      100,
      120,
      150,
      180,
      190, // satisfied
      300,
      500,
      800, // tolerating
      1500,
      2000, // frustrated
    ]);
    expect(result.satisfied).toBe(5);
    expect(result.tolerating).toBe(3);
    expect(result.frustrated).toBe(2);
    expect(result.score).toBe(0.65);
    expect(result.rating).toBe("poor");
  });

  it("respects custom thresholds", () => {
    const result = calculateApdex([100, 200, 300, 400], {
      satisfiedThreshold: 150,
      toleratedThreshold: 350,
    });
    expect(result.satisfied).toBe(1); // Only 100ms
    expect(result.tolerating).toBe(2); // 200, 300
    expect(result.frustrated).toBe(1); // 400
  });

  it("assigns correct ratings at boundaries", () => {
    // 0.94+ = excellent
    expect(calculateApdex([100, 100, 100, 100, 100]).rating).toBe("excellent");

    // 0.85-0.93 = good (8.5/10 satisfied = 0.85)
    const goodResult = calculateApdex([
      100, 100, 100, 100, 100, 100, 100, 100, 500, 500,
    ]);
    expect(goodResult.rating).toBe("good");

    // 0.70-0.84 = fair
    const fairResult = calculateApdex([100, 100, 100, 100, 500, 500, 500, 500]);
    expect(fairResult.rating).toBe("fair");
  });

  it("rounds score to 3 decimal places", () => {
    // 1/3 satisfied, 2/3 tolerating = (1 + 1) / 3 = 0.666...
    const result = calculateApdex([100, 500, 600]);
    expect(result.score).toBe(0.667);
  });
});

describe("getNaturalStatusMessage", () => {
  describe("up status", () => {
    it("returns API-specific message for API URLs", () => {
      expect(
        getNaturalStatusMessage("up", "https://example.com/api/health"),
      ).toBe("API responding normally");
      expect(getNaturalStatusMessage("up", "https://api.example.com/v1")).toBe(
        "API responding normally",
      );
    });

    it("returns health-specific message for health check URLs", () => {
      expect(getNaturalStatusMessage("up", "https://example.com/health")).toBe(
        "Service healthy",
      );
      expect(getNaturalStatusMessage("up", "https://example.com/status")).toBe(
        "Service healthy",
      );
      expect(getNaturalStatusMessage("up", "https://example.com/ping")).toBe(
        "Service healthy",
      );
    });

    it("returns website-specific message for root URLs", () => {
      expect(getNaturalStatusMessage("up", "https://example.com/")).toBe(
        "Website is up",
      );
      expect(getNaturalStatusMessage("up", "https://example.com")).toBe(
        "Website is up",
      );
    });

    it("returns generic message for other URLs", () => {
      expect(
        getNaturalStatusMessage("up", "https://example.com/some/path"),
      ).toBe("All systems operational");
    });

    it("indicates slow response when responseTime > 500ms", () => {
      expect(
        getNaturalStatusMessage("up", "https://example.com/api/health", {
          lastResponseTime: 600,
        }),
      ).toBe("API responding slowly");
      expect(
        getNaturalStatusMessage("up", "https://example.com/", {
          lastResponseTime: 700,
        }),
      ).toBe("Website loading slowly");
    });
  });

  describe("degraded status", () => {
    it("returns API-specific degraded message", () => {
      expect(
        getNaturalStatusMessage("degraded", "https://example.com/api/"),
      ).toBe("API experiencing issues");
    });

    it("includes duration when degradedSinceMs is provided", () => {
      expect(
        getNaturalStatusMessage("degraded", "https://example.com/api/", {
          degradedSinceMs: 120000, // 2 minutes
        }),
      ).toBe("API experiencing issues for 2 minutes");
      expect(
        getNaturalStatusMessage("degraded", "https://example.com/", {
          degradedSinceMs: 3600000, // 1 hour
        }),
      ).toBe("Website partially unavailable for 1 hour");
    });

    it("formats duration correctly", () => {
      expect(
        getNaturalStatusMessage("degraded", "https://example.com/api", {
          degradedSinceMs: 30000, // 30 seconds
        }),
      ).toContain("less than a minute");
      expect(
        getNaturalStatusMessage("degraded", "https://example.com/api", {
          degradedSinceMs: 60000, // 1 minute
        }),
      ).toContain("1 minute");
      expect(
        getNaturalStatusMessage("degraded", "https://example.com/api", {
          degradedSinceMs: 7200000, // 2 hours
        }),
      ).toContain("2 hours");
    });
  });

  describe("down status", () => {
    it("returns API-specific down message", () => {
      expect(getNaturalStatusMessage("down", "https://example.com/api/")).toBe(
        "API is unreachable",
      );
    });

    it("returns website-specific down message", () => {
      expect(getNaturalStatusMessage("down", "https://example.com/")).toBe(
        "Website is unreachable",
      );
    });

    it("includes failure count when consecutiveFailures > 3", () => {
      expect(
        getNaturalStatusMessage("down", "https://example.com/api", {
          consecutiveFailures: 5,
        }),
      ).toBe("API is unreachable (5 failed checks)");
    });

    it("does not include failure count when consecutiveFailures <= 3", () => {
      expect(
        getNaturalStatusMessage("down", "https://example.com/api", {
          consecutiveFailures: 3,
        }),
      ).toBe("API is unreachable");
    });
  });
});
