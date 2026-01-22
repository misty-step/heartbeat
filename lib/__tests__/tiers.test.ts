import { describe, test, expect } from "vitest";
import {
  TIERS,
  TRIAL_DAYS,
  TRIAL_TIER,
  getTier,
  getTierLimits,
  formatInterval,
  formatPrice,
  getAvailableIntervals,
} from "../tiers";

describe("TIERS configuration", () => {
  test("pulse tier has correct limits", () => {
    expect(TIERS.pulse.monitors).toBe(15);
    expect(TIERS.pulse.minInterval).toBe(180);
    expect(TIERS.pulse.statusPages).toBe(1);
    expect(TIERS.pulse.historyDays).toBe(30);
    expect(TIERS.pulse.webhooks).toBe(false);
    expect(TIERS.pulse.apiAccess).toBe(false);
  });

  test("vital tier has correct limits", () => {
    expect(TIERS.vital.monitors).toBe(75);
    expect(TIERS.vital.minInterval).toBe(60);
    expect(TIERS.vital.statusPages).toBe(5);
    expect(TIERS.vital.historyDays).toBe(90);
    expect(TIERS.vital.webhooks).toBe(true);
    expect(TIERS.vital.apiAccess).toBe(true);
  });

  test("pulse tier has correct pricing", () => {
    expect(TIERS.pulse.monthlyPrice).toBe(900);
    expect(TIERS.pulse.yearlyPrice).toBe(8600);
    // Yearly should be ~20% discount
    const expectedYearly = TIERS.pulse.monthlyPrice * 12 * 0.8;
    expect(TIERS.pulse.yearlyPrice).toBeLessThanOrEqual(expectedYearly);
  });

  test("vital tier has correct pricing", () => {
    expect(TIERS.vital.monthlyPrice).toBe(2900);
    expect(TIERS.vital.yearlyPrice).toBe(27800);
    // Yearly should be ~20% discount
    const expectedYearly = TIERS.vital.monthlyPrice * 12 * 0.8;
    expect(TIERS.vital.yearlyPrice).toBeLessThanOrEqual(expectedYearly);
  });

  test("vital tier has better limits than pulse", () => {
    expect(TIERS.vital.monitors).toBeGreaterThan(TIERS.pulse.monitors);
    expect(TIERS.vital.minInterval).toBeLessThan(TIERS.pulse.minInterval);
    expect(TIERS.vital.statusPages).toBeGreaterThan(TIERS.pulse.statusPages);
    expect(TIERS.vital.historyDays).toBeGreaterThan(TIERS.pulse.historyDays);
  });
});

describe("TRIAL configuration", () => {
  test("trial is 14 days", () => {
    expect(TRIAL_DAYS).toBe(14);
  });

  test("trial tier is vital (full access)", () => {
    expect(TRIAL_TIER).toBe("vital");
  });
});

describe("getTier", () => {
  test("returns pulse tier", () => {
    const tier = getTier("pulse");
    expect(tier.name).toBe("Pulse");
    expect(tier.monitors).toBe(15);
  });

  test("returns vital tier", () => {
    const tier = getTier("vital");
    expect(tier.name).toBe("Vital");
    expect(tier.monitors).toBe(75);
  });
});

describe("getTierLimits", () => {
  test("returns pulse tier limits without pricing", () => {
    const limits = getTierLimits("pulse");
    expect(limits.monitors).toBe(15);
    expect(limits.minInterval).toBe(180);
    expect(limits.statusPages).toBe(1);
    expect(limits.historyDays).toBe(30);
    expect(limits.webhooks).toBe(false);
    expect(limits.apiAccess).toBe(false);
    // Should not include pricing
    expect("monthlyPrice" in limits).toBe(false);
    expect("yearlyPrice" in limits).toBe(false);
  });

  test("returns vital tier limits without pricing", () => {
    const limits = getTierLimits("vital");
    expect(limits.monitors).toBe(75);
    expect(limits.minInterval).toBe(60);
    expect(limits.statusPages).toBe(5);
    expect(limits.historyDays).toBe(90);
    expect(limits.webhooks).toBe(true);
    expect(limits.apiAccess).toBe(true);
  });
});

describe("formatInterval", () => {
  test("formats 60 seconds as 1 minute", () => {
    expect(formatInterval(60)).toBe("1 minute");
  });

  test("formats 120 seconds as 2 minutes", () => {
    expect(formatInterval(120)).toBe("2 minutes");
  });

  test("formats 180 seconds as 3 minutes", () => {
    expect(formatInterval(180)).toBe("3 minutes");
  });

  test("formats 300 seconds as 5 minutes", () => {
    expect(formatInterval(300)).toBe("5 minutes");
  });

  test("formats 600 seconds as 10 minutes", () => {
    expect(formatInterval(600)).toBe("10 minutes");
  });

  test("formats 1800 seconds as 30 minutes", () => {
    expect(formatInterval(1800)).toBe("30 minutes");
  });

  test("formats 3600 seconds as 1 hour", () => {
    expect(formatInterval(3600)).toBe("1 hour");
  });

  test("formats 7200 seconds as 2 hours", () => {
    expect(formatInterval(7200)).toBe("2 hours");
  });
});

describe("formatPrice", () => {
  test("formats 900 cents as $9", () => {
    expect(formatPrice(900)).toBe("$9");
  });

  test("formats 2900 cents as $29", () => {
    expect(formatPrice(2900)).toBe("$29");
  });

  test("formats 8600 cents as $86", () => {
    expect(formatPrice(8600)).toBe("$86");
  });

  test("formats 27800 cents as $278", () => {
    expect(formatPrice(27800)).toBe("$278");
  });

  test("formats 0 cents as $0", () => {
    expect(formatPrice(0)).toBe("$0");
  });

  test("formats 100 cents as $1", () => {
    expect(formatPrice(100)).toBe("$1");
  });
});

describe("getAvailableIntervals", () => {
  test("returns all intervals for 60 second minimum", () => {
    const intervals = getAvailableIntervals(60);
    expect(intervals).toEqual([60, 120, 300, 600, 1800, 3600]);
  });

  test("excludes 60s for 120 second minimum", () => {
    const intervals = getAvailableIntervals(120);
    expect(intervals).toEqual([120, 300, 600, 1800, 3600]);
  });

  test("returns intervals >= 180 seconds for pulse tier", () => {
    const intervals = getAvailableIntervals(180);
    expect(intervals).toEqual([300, 600, 1800, 3600]);
  });

  test("returns only hourly for 3600 second minimum", () => {
    const intervals = getAvailableIntervals(3600);
    expect(intervals).toEqual([3600]);
  });

  test("returns empty array for minimum above all intervals", () => {
    const intervals = getAvailableIntervals(7200);
    expect(intervals).toEqual([]);
  });

  test("vital tier minimum (60s) gets all intervals", () => {
    const intervals = getAvailableIntervals(TIERS.vital.minInterval);
    expect(intervals).toHaveLength(6);
    expect(intervals[0]).toBe(60);
  });

  test("pulse tier minimum (180s) excludes 1m and 2m", () => {
    const intervals = getAvailableIntervals(TIERS.pulse.minInterval);
    expect(intervals).not.toContain(60);
    expect(intervals).not.toContain(120);
    expect(intervals[0]).toBe(300);
  });
});
