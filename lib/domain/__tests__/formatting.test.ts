import { describe, it, expect } from "vitest";
import {
  formatRelativeTime,
  formatDuration,
  calculateDuration,
  formatTimestamp,
  formatResponseTime,
} from "../formatting";

describe("formatRelativeTime", () => {
  // Use a fixed "now" for all tests to avoid flakiness
  const now = 1700000000000; // Nov 14, 2023

  it('returns "just now" for timestamps less than 1 minute ago', () => {
    expect(formatRelativeTime(now - 30000, now)).toBe("just now"); // 30 seconds
    expect(formatRelativeTime(now - 59999, now)).toBe("just now"); // 59.999 seconds
    expect(formatRelativeTime(now, now)).toBe("just now"); // 0 seconds
  });

  it('returns "1 minute ago" for timestamps exactly 1 minute ago', () => {
    expect(formatRelativeTime(now - 60000, now)).toBe("1 minute ago");
    expect(formatRelativeTime(now - 90000, now)).toBe("1 minute ago"); // 1.5 minutes rounds down
  });

  it("returns X minutes ago for timestamps less than 1 hour", () => {
    expect(formatRelativeTime(now - 120000, now)).toBe("2 minutes ago");
    expect(formatRelativeTime(now - 300000, now)).toBe("5 minutes ago");
    expect(formatRelativeTime(now - 3599000, now)).toBe("59 minutes ago");
  });

  it('returns "1 hour ago" for timestamps exactly 1 hour ago', () => {
    expect(formatRelativeTime(now - 3600000, now)).toBe("1 hour ago");
  });

  it("returns X hours ago for timestamps less than 24 hours", () => {
    expect(formatRelativeTime(now - 7200000, now)).toBe("2 hours ago");
    expect(formatRelativeTime(now - 82800000, now)).toBe("23 hours ago");
  });

  it('returns "1 day ago" for timestamps exactly 24 hours ago', () => {
    expect(formatRelativeTime(now - 86400000, now)).toBe("1 day ago");
  });

  it("returns X days ago for older timestamps", () => {
    expect(formatRelativeTime(now - 172800000, now)).toBe("2 days ago");
    expect(formatRelativeTime(now - 604800000, now)).toBe("7 days ago");
  });

  it("uses Date.now() when now is not provided", () => {
    // Just verify it doesn't throw
    const result = formatRelativeTime(Date.now() - 60000);
    expect(result).toBe("1 minute ago");
  });
});

describe("formatDuration", () => {
  it("returns minutes only for durations less than 1 hour", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(60000)).toBe("1m");
    expect(formatDuration(300000)).toBe("5m");
    expect(formatDuration(3540000)).toBe("59m");
  });

  it("returns hours only when no remaining minutes", () => {
    expect(formatDuration(3600000)).toBe("1h");
    expect(formatDuration(7200000)).toBe("2h");
  });

  it("returns hours and minutes when there are remaining minutes", () => {
    expect(formatDuration(3660000)).toBe("1h 1m");
    expect(formatDuration(5400000)).toBe("1h 30m");
    expect(formatDuration(7260000)).toBe("2h 1m"); // 2 hours 1 minute
  });
});

describe("calculateDuration", () => {
  const now = 1700000000000;

  it("calculates duration between start and resolved time", () => {
    const start = new Date(now - 3600000); // 1 hour ago
    const resolved = new Date(now);
    expect(calculateDuration(start, resolved, now)).toBe("1h");
  });

  it("calculates duration from start to now when not resolved", () => {
    const start = new Date(now - 300000); // 5 minutes ago
    expect(calculateDuration(start, undefined, now)).toBe("5m");
  });

  it("handles zero duration", () => {
    const start = new Date(now);
    expect(calculateDuration(start, undefined, now)).toBe("0m");
  });
});

describe("formatTimestamp", () => {
  it("formats date in expected locale format", () => {
    const date = new Date("2023-11-14T15:30:00");
    const result = formatTimestamp(date);
    // The exact format depends on locale, but should include month, day, hour, minute
    expect(result).toMatch(/Nov/);
    expect(result).toMatch(/14/);
    expect(result).toMatch(/30/);
  });
});

describe("formatResponseTime", () => {
  it("returns milliseconds for values under 1 second", () => {
    expect(formatResponseTime(0)).toBe("0ms");
    expect(formatResponseTime(1)).toBe("1ms");
    expect(formatResponseTime(500)).toBe("500ms");
    expect(formatResponseTime(999)).toBe("999ms");
  });

  it("returns seconds for values 1 second and over", () => {
    expect(formatResponseTime(1000)).toBe("1.00s");
    expect(formatResponseTime(1500)).toBe("1.50s");
    expect(formatResponseTime(2345)).toBe("2.35s"); // Truncated, not rounded
  });
});
