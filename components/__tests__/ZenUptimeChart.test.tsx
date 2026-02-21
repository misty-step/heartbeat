import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ZenUptimeChart } from "../ZenUptimeChart";

// SVGElement.getTotalLength is mocked in tests/setup.ts

describe("ZenUptimeChart", () => {
  const mockData = [
    { timestamp: 1000, responseTime: 100, status: "up" as const },
    { timestamp: 2000, responseTime: 200, status: "up" as const },
    { timestamp: 3000, responseTime: 150, status: "up" as const },
  ];

  it("returns null for empty data", () => {
    const { container } = render(<ZenUptimeChart data={[]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders SVG element with correct viewBox", () => {
    render(<ZenUptimeChart data={mockData} width={400} height={128} />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 400 128");
  });

  it("generates a path element for the chart line", () => {
    render(<ZenUptimeChart data={mockData} />);
    const path = document.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute("d")).toMatch(/^M/); // Path starts with Move command
    expect(path?.getAttribute("d")).toMatch(/Q/); // Contains Quadratic bezier curves
  });

  it("renders hover areas for each data point", () => {
    render(<ZenUptimeChart data={mockData} />);
    // Each data point has an invisible hit area circle
    const circles = document.querySelectorAll("circle");
    expect(circles.length).toBe(mockData.length);
  });

  it("hit area radius is 22 when point spacing allows (sparse data)", () => {
    // 3 points in width=400 → stepX = 392/2 = 196, hitRadius = min(22, 98) = 22
    render(<ZenUptimeChart data={mockData} width={400} height={128} />);
    const hitAreas = document.querySelectorAll("circle");
    hitAreas.forEach((circle) => {
      expect(Number(circle.getAttribute("r"))).toBe(22);
    });
  });

  it("hit area radius is capped at half point spacing for dense data to prevent overlap", () => {
    // 50 points in width=400 → stepX = 392/49 ≈ 8.0, hitRadius = min(22, 4.0) ≈ 4.0
    const denseData = Array.from({ length: 50 }, (_, i) => ({
      timestamp: i * 1000,
      responseTime: 100 + i,
      status: "up" as const,
    }));
    const { unmount } = render(
      <ZenUptimeChart data={denseData} width={400} height={128} />,
    );
    const hitAreas = document.querySelectorAll("circle");
    const stepX = 392 / 49; // chartWidth / (n - 1)
    hitAreas.forEach((circle) => {
      const r = Number(circle.getAttribute("r"));
      expect(r).toBeGreaterThan(0);
      // Circles must not overlap: r <= stepX / 2
      expect(r).toBeLessThanOrEqual(stepX / 2 + Number.EPSILON);
    });
    unmount();
  });

  it("shows tooltip on touch (pointerdown with pointerType=touch)", () => {
    render(<ZenUptimeChart data={mockData} />);
    const hitAreas = document.querySelectorAll("circle");

    fireEvent.pointerDown(hitAreas[0], { pointerType: "touch" });

    expect(screen.getByText("100ms")).toBeInTheDocument();
  });

  it("hides tooltip on touch release (pointerup with pointerType=touch)", () => {
    render(<ZenUptimeChart data={mockData} />);
    const hitAreas = document.querySelectorAll("circle");

    fireEvent.pointerDown(hitAreas[0], { pointerType: "touch" });
    expect(screen.getByText("100ms")).toBeInTheDocument();

    fireEvent.pointerUp(hitAreas[0], { pointerType: "touch" });
    expect(screen.queryByText("100ms")).not.toBeInTheDocument();
  });

  it("hides tooltip on touch cancel (interrupted interaction)", () => {
    render(<ZenUptimeChart data={mockData} />);
    const hitAreas = document.querySelectorAll("circle");

    fireEvent.pointerDown(hitAreas[0], { pointerType: "touch" });
    expect(screen.getByText("100ms")).toBeInTheDocument();

    fireEvent.pointerCancel(hitAreas[0]);
    expect(screen.queryByText("100ms")).not.toBeInTheDocument();
  });

  it("does not show tooltip when a synthetic mouseenter follows a touch release", () => {
    // Mobile browsers dispatch synthetic mouse events after touch. The
    // component listens only to pointer events, so these are ignored.
    render(<ZenUptimeChart data={mockData} />);
    const hitAreas = document.querySelectorAll("circle");

    fireEvent.pointerDown(hitAreas[0], { pointerType: "touch" });
    fireEvent.pointerUp(hitAreas[0], { pointerType: "touch" });
    expect(screen.queryByText("100ms")).not.toBeInTheDocument();

    // Simulate the synthetic mouseenter that mobile browsers fire after touch
    fireEvent.mouseEnter(hitAreas[0]);
    // Still hidden — we don't listen to onMouseEnter
    expect(screen.queryByText("100ms")).not.toBeInTheDocument();
  });

  it("shows tooltip on hover with response time (mouse)", () => {
    render(<ZenUptimeChart data={mockData} />);
    const hitAreas = document.querySelectorAll("circle");

    // Mouse hover via pointer event
    fireEvent.pointerEnter(hitAreas[0], { pointerType: "mouse" });

    expect(screen.getByText("100ms")).toBeInTheDocument();
  });

  it("hides tooltip when pointer leaves SVG area", () => {
    render(<ZenUptimeChart data={mockData} />);
    const svg = document.querySelector("svg")!;
    const hitAreas = document.querySelectorAll("circle");

    fireEvent.pointerEnter(hitAreas[0], { pointerType: "mouse" });
    expect(screen.getByText("100ms")).toBeInTheDocument();

    fireEvent.pointerLeave(svg);
    expect(screen.queryByText("100ms")).not.toBeInTheDocument();
  });

  it("does not show tooltip when pointer enters with touch pointerType", () => {
    // Touch interactions should use pointerdown, not pointerenter
    render(<ZenUptimeChart data={mockData} />);
    const hitAreas = document.querySelectorAll("circle");

    fireEvent.pointerEnter(hitAreas[0], { pointerType: "touch" });
    expect(screen.queryByText("100ms")).not.toBeInTheDocument();
  });

  it("uses 100 as minimum floor for max response time scaling", () => {
    // All values below 100 should still scale against 100
    const lowData = [
      { timestamp: 1000, responseTime: 50, status: "up" as const },
      { timestamp: 2000, responseTime: 25, status: "up" as const },
    ];

    render(<ZenUptimeChart data={lowData} />);
    const path = document.querySelector("path");
    // Should render without error and produce valid path
    expect(path?.getAttribute("d")).toMatch(/^M.*Q/);
  });

  it("handles single data point", () => {
    const singlePoint = [
      { timestamp: 1000, responseTime: 100, status: "up" as const },
    ];

    render(<ZenUptimeChart data={singlePoint} />);
    const path = document.querySelector("path");
    // Single point = just a Move, no curves
    expect(path?.getAttribute("d")).toMatch(/^M \d/);
  });
});
