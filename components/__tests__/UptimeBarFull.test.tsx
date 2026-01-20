import { describe, expect, test, vi, beforeEach, type Mock } from "vitest";
import { render } from "@testing-library/react";
import { UptimeBar } from "../UptimeBar";
import { useQuery } from "convex/react";

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
      <UptimeBar monitorId={"monitor-1" as any} days={5} />,
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
      <UptimeBar monitorId={"monitor-2" as any} days={4} />,
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
      <UptimeBar monitorId={"monitor-3" as any} days={4} />,
    );
    const bars = Array.from(container.querySelectorAll(".flex-1.h-6"));
    bars.forEach((bar) => {
      expect((bar as HTMLElement).className).toContain("bg-down");
    });
  });
});
