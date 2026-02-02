import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResponseTimeline } from "../ResponseTimeline";

describe("ResponseTimeline", () => {
  describe("empty data", () => {
    it('renders "No data yet" message', () => {
      render(<ResponseTimeline data={[]} />);
      expect(screen.getByText("No data yet")).toBeInTheDocument();
    });
  });

  describe("with data", () => {
    const mockData = [
      {
        timestamp: Date.now() - 300000,
        responseTime: 100,
        status: "up" as const,
      },
      {
        timestamp: Date.now() - 200000,
        responseTime: 150,
        status: "up" as const,
      },
      {
        timestamp: Date.now() - 100000,
        responseTime: 200,
        status: "up" as const,
      },
    ];

    it("renders SVG with correct viewBox", () => {
      const { container } = render(<ResponseTimeline data={mockData} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 400 64");
    });

    it("renders baseline", () => {
      const { container } = render(<ResponseTimeline data={mockData} />);
      const line = container.querySelector("line");
      expect(line).toBeInTheDocument();
    });

    it("renders path for timeline", () => {
      const { container } = render(<ResponseTimeline data={mockData} />);
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBeGreaterThan(0);
    });

    it("renders circles for check dots", () => {
      const { container } = render(<ResponseTimeline data={mockData} />);
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBe(mockData.length);
    });

    it("has correct aria-label", () => {
      const { container } = render(<ResponseTimeline data={mockData} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-label", "Response time timeline");
    });
  });

  describe("status variations", () => {
    it("renders degraded checks with degraded color", () => {
      const dataWithDegraded = [
        {
          timestamp: Date.now(),
          responseTime: 100,
          status: "degraded" as const,
        },
      ];
      const { container } = render(
        <ResponseTimeline data={dataWithDegraded} />,
      );
      const circle = container.querySelector("circle");
      expect(circle).toHaveAttribute("fill", "var(--color-status-degraded)");
    });

    it("renders failure markers for down status", () => {
      const dataWithFailure = [
        {
          timestamp: Date.now() - 100000,
          responseTime: 100,
          status: "up" as const,
        },
        { timestamp: Date.now(), responseTime: 0, status: "down" as const },
      ];
      const { container } = render(<ResponseTimeline data={dataWithFailure} />);
      // Down status creates failure markers, not regular circles
      const circles = container.querySelectorAll("circle");
      // 1 for the up check, 1 for the failure marker
      expect(circles.length).toBe(2);
    });

    it("uses down color for path when there are failures", () => {
      const dataWithFailure = [
        { timestamp: Date.now(), responseTime: 0, status: "down" as const },
      ];
      const { container } = render(<ResponseTimeline data={dataWithFailure} />);
      const path = container.querySelector("path");
      expect(path).toHaveAttribute("stroke", "var(--color-status-down)");
    });
  });

  describe("slow response dips", () => {
    it("creates dip for slow responses (>200ms)", () => {
      const dataWithSlow = [
        {
          timestamp: Date.now() - 100000,
          responseTime: 100,
          status: "up" as const,
        },
        { timestamp: Date.now(), responseTime: 500, status: "up" as const }, // Slow
      ];
      const { container } = render(<ResponseTimeline data={dataWithSlow} />);
      const path = container.querySelector("path");
      // Path should contain curve commands (C) for slow responses
      const pathD = path?.getAttribute("d") || "";
      expect(pathD).toContain("C"); // Bezier curve for dip
    });
  });

  describe("live indicator", () => {
    const mockData = [
      { timestamp: Date.now(), responseTime: 100, status: "up" as const },
    ];

    it("does not show live indicator by default", () => {
      const { container } = render(<ResponseTimeline data={mockData} />);
      const animatedElements = container.querySelectorAll(
        ".animate-hs-ember-flicker",
      );
      expect(animatedElements.length).toBe(0);
    });

    it("shows live indicator when showLive is true", () => {
      const { container } = render(
        <ResponseTimeline data={mockData} showLive />,
      );
      const animatedElements = container.querySelectorAll(
        ".animate-hs-ember-flicker",
      );
      expect(animatedElements.length).toBe(1);
    });

    it("live indicator uses correct color for up status", () => {
      const { container } = render(
        <ResponseTimeline data={mockData} showLive />,
      );
      const liveIndicator = container.querySelector(
        ".animate-hs-ember-flicker",
      );
      expect(liveIndicator).toHaveAttribute("fill", "var(--color-status-up)");
    });

    it("live indicator uses correct color for degraded status", () => {
      const degradedData = [
        {
          timestamp: Date.now(),
          responseTime: 100,
          status: "degraded" as const,
        },
      ];
      const { container } = render(
        <ResponseTimeline data={degradedData} showLive />,
      );
      const liveIndicator = container.querySelector(
        ".animate-hs-ember-flicker",
      );
      expect(liveIndicator).toHaveAttribute(
        "fill",
        "var(--color-status-degraded)",
      );
    });

    it("live indicator uses correct color for down status", () => {
      const downData = [
        { timestamp: Date.now(), responseTime: 0, status: "down" as const },
      ];
      const { container } = render(
        <ResponseTimeline data={downData} showLive />,
      );
      const liveIndicator = container.querySelector(
        ".animate-hs-ember-flicker",
      );
      expect(liveIndicator).toHaveAttribute("fill", "var(--color-status-down)");
    });
  });

  describe("className", () => {
    it("applies custom className", () => {
      const mockData = [
        { timestamp: Date.now(), responseTime: 100, status: "up" as const },
      ];
      const { container } = render(
        <ResponseTimeline data={mockData} className="custom-timeline" />,
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-timeline");
    });
  });
});
