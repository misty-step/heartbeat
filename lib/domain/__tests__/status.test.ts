import { describe, it, expect } from "vitest";
import {
  computeStatus,
  aggregateStatuses,
  getStatusLabel,
  getStatusHeadline,
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
