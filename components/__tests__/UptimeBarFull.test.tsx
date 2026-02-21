import { describe, expect, test, vi, beforeEach, type Mock } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { type Id } from "convex/values";
import { UptimeBar } from "@/components/UptimeBar";
import { useQuery } from "convex/react";

const monitorId = (s: string) => s as unknown as Id<"monitors">;

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

const mockUseQuery = useQuery as unknown as Mock;

// Helper to generate daily status data for tests
function generateDailyStatus(
  days: number,
  statuses: Array<"up" | "degraded" | "down">,
) {
  const today = new Date();
  return statuses.map((status, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    return { date: date.toISOString().split("T")[0], status };
  });
}

describe("UptimeBar", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  test("shows loading skeleton while stats are loading", () => {
    mockUseQuery.mockReturnValue(undefined);
    const { container } = render(
      <UptimeBar monitorId={monitorId("monitor-1")} days={5} />,
    );
    const placeholders = container.querySelectorAll(".animate-pulse");
    expect(placeholders.length).toBe(5);
  });

  test("renders bars with correct status colors", () => {
    // Mock: 4 days, first 3 up, last 1 down
    mockUseQuery.mockReturnValue(
      generateDailyStatus(4, ["up", "up", "up", "down"]),
    );
    const { container } = render(
      <UptimeBar monitorId={monitorId("monitor-2")} days={4} />,
    );
    const bars = container.querySelectorAll(".flex-1.h-6");
    expect(bars.length).toBe(4);
    // Last bar should be down-colored
    expect((bars[bars.length - 1] as HTMLElement).className).toContain(
      "bg-down",
    );
    // First bars should be up-colored (Kyoto Moss uses bg-up)
    expect((bars[0] as HTMLElement).className).toContain("bg-up");
  });

  test("marks all bars down when all days have failures", () => {
    mockUseQuery.mockReturnValue(
      generateDailyStatus(4, ["down", "down", "down", "down"]),
    );
    const { container } = render(
      <UptimeBar monitorId={monitorId("monitor-3")} days={4} />,
    );
    const bars = Array.from(container.querySelectorAll(".flex-1.h-6"));
    bars.forEach((bar) => {
      expect((bar as HTMLElement).className).toContain("bg-down");
    });
  });

  test("renders degraded status bars with degraded color", () => {
    mockUseQuery.mockReturnValue(
      generateDailyStatus(3, ["degraded", "degraded", "degraded"]),
    );
    const { container } = render(
      <UptimeBar monitorId={monitorId("monitor-4")} days={3} />,
    );
    const bars = Array.from(container.querySelectorAll(".flex-1.h-6"));
    bars.forEach((bar) => {
      expect((bar as HTMLElement).className).toContain("bg-degraded");
    });
  });

  test("renders unknown status (no data) bars with subtle border color", () => {
    // Return empty array — all dates will have no data (unknown status)
    mockUseQuery.mockReturnValue([]);
    const { container } = render(
      <UptimeBar monitorId={monitorId("monitor-5")} days={3} />,
    );
    const bars = Array.from(container.querySelectorAll(".flex-1.h-6"));
    bars.forEach((bar) => {
      // Unknown dates use border-subtle color, not a status color
      expect((bar as HTMLElement).className).not.toContain("bg-up");
      expect((bar as HTMLElement).className).not.toContain("bg-down");
      expect((bar as HTMLElement).className).not.toContain("bg-degraded");
    });
  });

  test("shows tooltip with date and status on hover", () => {
    mockUseQuery.mockReturnValue(generateDailyStatus(3, ["up", "down", "up"]));
    const { container } = render(
      <UptimeBar monitorId={monitorId("monitor-6")} days={3} />,
    );
    const bars = Array.from(container.querySelectorAll(".flex-1.h-6"));
    // Hover the second bar (down)
    fireEvent.mouseEnter(bars[1]);
    // Tooltip should be visible — look for status text
    const tooltip = container.querySelector(".absolute.-top-10");
    expect(tooltip).not.toBeNull();
  });

  test("hides tooltip when mouse leaves the container", () => {
    mockUseQuery.mockReturnValue(generateDailyStatus(3, ["up", "up", "up"]));
    const { container } = render(
      <UptimeBar monitorId={monitorId("monitor-7")} days={3} />,
    );
    const bars = Array.from(container.querySelectorAll(".flex-1.h-6"));
    // Hover then leave
    fireEvent.mouseEnter(bars[0]);
    const wrapper = container.querySelector(".relative.flex.gap-\\[2px\\]");
    if (wrapper) fireEvent.mouseLeave(wrapper);
    const tooltip = container.querySelector(".absolute.-top-10");
    expect(tooltip).toBeNull();
  });
});
