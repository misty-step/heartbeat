import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTimestamp, formatDuration, sendEmail } from "../email";

describe("formatTimestamp", () => {
  test("formats timestamp with date and time in UTC", () => {
    // Jan 15, 2024 at 14:30:00 UTC
    const timestamp = Date.UTC(2024, 0, 15, 14, 30, 0);
    const formatted = formatTimestamp(timestamp);

    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2024");
    expect(formatted).toContain("UTC");
  });

  test("formats midnight correctly", () => {
    const midnight = Date.UTC(2024, 5, 1, 0, 0, 0);
    const formatted = formatTimestamp(midnight);

    expect(formatted).toContain("Jun");
    expect(formatted).toContain("1");
    expect(formatted).toContain("2024");
    expect(formatted).toContain("12:00");
    expect(formatted).toContain("AM");
  });

  test("formats noon correctly", () => {
    const noon = Date.UTC(2024, 5, 1, 12, 0, 0);
    const formatted = formatTimestamp(noon);

    expect(formatted).toContain("12:00");
    expect(formatted).toContain("PM");
  });

  test("handles edge of year", () => {
    const newYearsEve = Date.UTC(2024, 11, 31, 23, 59, 59);
    const formatted = formatTimestamp(newYearsEve);

    expect(formatted).toContain("Dec");
    expect(formatted).toContain("31");
    expect(formatted).toContain("2024");
  });

  test("handles leap year date", () => {
    const leapDay = Date.UTC(2024, 1, 29, 12, 0, 0);
    const formatted = formatTimestamp(leapDay);

    expect(formatted).toContain("Feb");
    expect(formatted).toContain("29");
    expect(formatted).toContain("2024");
  });
});

describe("formatDuration", () => {
  describe("seconds only", () => {
    test("formats 0 seconds", () => {
      expect(formatDuration(0)).toBe("0s");
    });

    test("formats 1 second", () => {
      expect(formatDuration(1000)).toBe("1s");
    });

    test("formats 30 seconds", () => {
      expect(formatDuration(30000)).toBe("30s");
    });

    test("formats 59 seconds", () => {
      expect(formatDuration(59000)).toBe("59s");
    });
  });

  describe("minutes only", () => {
    test("formats exactly 1 minute", () => {
      expect(formatDuration(60000)).toBe("1m");
    });

    test("formats 5 minutes", () => {
      expect(formatDuration(5 * 60 * 1000)).toBe("5m");
    });

    test("formats 59 minutes", () => {
      expect(formatDuration(59 * 60 * 1000)).toBe("59m");
    });
  });

  describe("hours only", () => {
    test("formats exactly 1 hour", () => {
      expect(formatDuration(60 * 60 * 1000)).toBe("1h");
    });

    test("formats 2 hours", () => {
      expect(formatDuration(2 * 60 * 60 * 1000)).toBe("2h");
    });

    test("formats 24 hours", () => {
      expect(formatDuration(24 * 60 * 60 * 1000)).toBe("24h");
    });
  });

  describe("hours and minutes", () => {
    test("formats 1 hour 30 minutes", () => {
      expect(formatDuration(90 * 60 * 1000)).toBe("1h 30m");
    });

    test("formats 2 hours 15 minutes", () => {
      const ms = (2 * 60 + 15) * 60 * 1000;
      expect(formatDuration(ms)).toBe("2h 15m");
    });

    test("formats 10 hours 1 minute", () => {
      const ms = (10 * 60 + 1) * 60 * 1000;
      expect(formatDuration(ms)).toBe("10h 1m");
    });
  });

  describe("edge cases", () => {
    test("truncates sub-second precision", () => {
      expect(formatDuration(500)).toBe("0s");
      expect(formatDuration(1500)).toBe("1s");
    });

    test("truncates seconds when showing minutes", () => {
      // 1 minute and 45 seconds shows as 1m (seconds ignored)
      expect(formatDuration(105000)).toBe("1m");
    });

    test("truncates seconds when showing hours", () => {
      // 1 hour, 30 minutes, 45 seconds shows as 1h 30m
      const ms = (90 * 60 + 45) * 1000;
      expect(formatDuration(ms)).toBe("1h 30m");
    });
  });

  describe("realistic incident durations", () => {
    test("short outage: 3 minutes", () => {
      expect(formatDuration(3 * 60 * 1000)).toBe("3m");
    });

    test("medium outage: 45 minutes", () => {
      expect(formatDuration(45 * 60 * 1000)).toBe("45m");
    });

    test("long outage: 2 hours 30 minutes", () => {
      expect(formatDuration(150 * 60 * 1000)).toBe("2h 30m");
    });

    test("very long outage: 12 hours", () => {
      expect(formatDuration(12 * 60 * 60 * 1000)).toBe("12h");
    });
  });
});

describe("sendEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("returns error when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      text: "Test message",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Email service not configured");
  });

  test("returns error when RESEND_API_KEY is empty string", async () => {
    process.env.RESEND_API_KEY = "";

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      text: "Test message",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Email service not configured");
  });
});

describe("email content formatting", () => {
  // These tests verify that our formatting functions produce
  // content suitable for email notifications

  test("formatTimestamp produces human-readable dates for emails", () => {
    const now = Date.now();
    const formatted = formatTimestamp(now);

    // Should be readable (contains expected components)
    expect(formatted).toMatch(/\w+ \d+, \d{4}/); // "Jan 15, 2024" pattern
    expect(formatted).toMatch(/\d+:\d+/); // time component
    expect(formatted).toContain("UTC");
  });

  test("formatDuration produces concise duration strings for emails", () => {
    // Test various durations that might appear in incident emails
    const durations = [
      { ms: 180000, expected: "3m" },
      { ms: 3600000, expected: "1h" },
      { ms: 5400000, expected: "1h 30m" },
    ];

    for (const { ms, expected } of durations) {
      expect(formatDuration(ms)).toBe(expected);
    }
  });
});
