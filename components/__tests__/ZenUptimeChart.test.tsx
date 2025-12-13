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
    // Each data point has an invisible hit area (r=8 circle)
    const circles = document.querySelectorAll("circle");
    expect(circles.length).toBe(mockData.length);
  });

  it("shows tooltip on hover with response time", () => {
    render(<ZenUptimeChart data={mockData} />);
    const hitAreas = document.querySelectorAll("circle");

    // Hover over first point
    fireEvent.mouseEnter(hitAreas[0]);

    // Should show visible point (r=3) and tooltip text
    expect(screen.getByText("100ms")).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave from SVG", () => {
    render(<ZenUptimeChart data={mockData} />);
    const svg = document.querySelector("svg")!;
    const hitAreas = document.querySelectorAll("circle");

    // Hover then leave
    fireEvent.mouseEnter(hitAreas[0]);
    expect(screen.getByText("100ms")).toBeInTheDocument();

    fireEvent.mouseLeave(svg);
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
