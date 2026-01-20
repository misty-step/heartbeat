import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AnimatedUptimePercentage } from "../AnimatedUptimePercentage";

// Force scroll animation hook to report visible so the counter runs immediately
vi.mock("@/hooks/useScrollAnimation", () => ({
  useScrollAnimation: () => ({ ref: { current: null }, isVisible: true }),
}));

describe("AnimatedUptimePercentage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("applies up color for ≥99.9%", async () => {
    render(
      <AnimatedUptimePercentage
        percentage={99.95}
        totalChecks={10}
        failedChecks={0}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    const value = await screen.findByText((text) => text.includes("99.95%"));
    expect(value.className).toContain("text-up");
  });

  test("uses up color for ≥99%", async () => {
    render(
      <AnimatedUptimePercentage
        percentage={99.1}
        totalChecks={10}
        failedChecks={0}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect(
      (await screen.findByText((text) => text.includes("99.10%"))).className,
    ).toContain("text-up");
  });

  test("uses up color at 99.0% boundary", async () => {
    render(
      <AnimatedUptimePercentage
        percentage={99.0}
        totalChecks={10}
        failedChecks={0}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect(
      (await screen.findByText((text) => text.includes("99.00%"))).className,
    ).toContain("text-up");
  });

  test("uses degraded color between 95% and 99%", async () => {
    render(
      <AnimatedUptimePercentage
        percentage={96}
        totalChecks={10}
        failedChecks={1}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect(
      (await screen.findByText((text) => text.includes("96.00%"))).className,
    ).toContain("text-degraded");
  });

  test("uses degraded color at 95.0% boundary", async () => {
    render(
      <AnimatedUptimePercentage
        percentage={95.0}
        totalChecks={10}
        failedChecks={1}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect(
      (await screen.findByText((text) => text.includes("95.00%"))).className,
    ).toContain("text-degraded");
  });

  test("uses down color below 95%", async () => {
    render(
      <AnimatedUptimePercentage
        percentage={80}
        totalChecks={10}
        failedChecks={2}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect(
      (await screen.findByText((text) => text.includes("80.00%"))).className,
    ).toContain("text-down");
  });
});
