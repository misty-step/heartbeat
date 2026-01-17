import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HoverSparkline, HoverSparklineWrapper } from "../HoverSparkline";

describe("HoverSparkline", () => {
  const mockData = [
    { responseTime: 100, status: "up" as const },
    { responseTime: 150, status: "up" as const },
    { responseTime: 200, status: "up" as const },
  ];

  describe("rendering", () => {
    it("returns null for empty data", () => {
      const { container } = render(<HoverSparkline data={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders svg with correct default dimensions", () => {
      const { container } = render(<HoverSparkline data={mockData} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 60 20");
    });

    it("renders svg with custom dimensions", () => {
      const { container } = render(
        <HoverSparkline data={mockData} width={100} height={30} />,
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 100 30");
    });
  });

  describe("path elements", () => {
    it("renders area fill and line paths", () => {
      const { container } = render(<HoverSparkline data={mockData} />);
      const paths = container.querySelectorAll("path");
      expect(paths.length).toBe(2); // area fill and line
    });

    it("uses normal color for successful checks", () => {
      const { container } = render(<HoverSparkline data={mockData} />);
      const line = container.querySelectorAll("path")[1];
      expect(line).toHaveAttribute("stroke", "var(--color-text-secondary)");
    });

    it("uses down color when there are failures", () => {
      const dataWithFailure = [
        { responseTime: 100, status: "up" as const },
        { responseTime: 0, status: "down" as const },
      ];
      const { container } = render(<HoverSparkline data={dataWithFailure} />);
      const line = container.querySelectorAll("path")[1];
      expect(line).toHaveAttribute("stroke", "var(--color-status-down)");
    });
  });

  describe("stats display", () => {
    it("does not show stats by default", () => {
      render(<HoverSparkline data={mockData} />);
      expect(screen.queryByText(/avg/)).not.toBeInTheDocument();
    });

    it("shows stats when showStats is true", () => {
      render(<HoverSparkline data={mockData} showStats />);
      expect(screen.getByText("150ms avg")).toBeInTheDocument();
    });
  });

  describe("aria-label", () => {
    it("includes stats in aria-label", () => {
      const { container } = render(<HoverSparkline data={mockData} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute(
        "aria-label",
        expect.stringContaining("avg 150ms"),
      );
    });
  });
});

describe("HoverSparklineWrapper", () => {
  const mockData = [
    { responseTime: 100, status: "up" as const },
    { responseTime: 150, status: "up" as const },
  ];

  it("renders children", () => {
    render(
      <HoverSparklineWrapper data={mockData}>
        <span>Child content</span>
      </HoverSparklineWrapper>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders sparkline on hover (hidden by default)", () => {
    const { container } = render(
      <HoverSparklineWrapper data={mockData}>
        <span>Hover me</span>
      </HoverSparklineWrapper>,
    );
    // Sparkline exists but is hidden (opacity-0)
    const sparklineContainer = container.querySelector(".opacity-0");
    expect(sparklineContainer).toBeInTheDocument();
  });

  it("does not render sparkline when data is empty", () => {
    const { container } = render(
      <HoverSparklineWrapper data={[]}>
        <span>Child</span>
      </HoverSparklineWrapper>,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <HoverSparklineWrapper data={mockData} className="custom-wrapper">
        <span>Child</span>
      </HoverSparklineWrapper>,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-wrapper");
  });
});
