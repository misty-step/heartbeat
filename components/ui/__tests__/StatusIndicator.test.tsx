import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusIndicator, StatusDot } from "../StatusIndicator";

describe("StatusIndicator", () => {
  describe("status variants", () => {
    it("renders up status with correct styling", () => {
      render(<StatusIndicator status="up" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("bg-up");
      expect(indicator).toHaveClass("animate-km-breathe");
      expect(indicator).toHaveAttribute("aria-label", "Status: up");
    });

    it("renders degraded status with correct styling", () => {
      render(<StatusIndicator status="degraded" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("bg-degraded");
      expect(indicator).toHaveClass("animate-km-breathe-subtle");
      expect(indicator).toHaveAttribute("aria-label", "Status: degraded");
    });

    it("renders down status with correct styling", () => {
      render(<StatusIndicator status="down" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("bg-down");
      expect(indicator).not.toHaveClass("animate-km-breathe");
      expect(indicator).toHaveAttribute("aria-label", "Status: down");
    });

    it("renders unknown status with correct styling", () => {
      render(<StatusIndicator status="unknown" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("bg-unknown");
      expect(indicator).toHaveClass("opacity-50");
      expect(indicator).toHaveAttribute("aria-label", "Status: unknown");
    });
  });

  describe("sizes", () => {
    it("renders md size by default", () => {
      render(<StatusIndicator status="up" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("size-3");
    });

    it("renders xs size", () => {
      render(<StatusIndicator status="up" size="xs" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("size-2");
    });

    it("renders sm size", () => {
      render(<StatusIndicator status="up" size="sm" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("size-2.5");
    });

    it("renders lg size", () => {
      render(<StatusIndicator status="up" size="lg" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("size-4");
    });

    it("renders xl size", () => {
      render(<StatusIndicator status="up" size="xl" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("size-5");
    });

    it("renders 2xl size", () => {
      render(<StatusIndicator status="up" size="2xl" />);
      const indicator = screen.getByRole("status");
      expect(indicator).toHaveClass("size-6");
    });
  });

  describe("glow effect", () => {
    it("does not show glow by default", () => {
      const { container } = render(<StatusIndicator status="up" />);
      const glowElements = container.querySelectorAll(".blur-sm");
      expect(glowElements.length).toBe(0);
    });

    it("shows glow when glow prop is true for up status", () => {
      const { container } = render(<StatusIndicator status="up" glow />);
      const glowElement = container.querySelector(".blur-sm");
      expect(glowElement).toBeInTheDocument();
      expect(glowElement).toHaveClass("bg-up");
    });

    it("shows glow when glow prop is true for degraded status", () => {
      const { container } = render(<StatusIndicator status="degraded" glow />);
      const glowElement = container.querySelector(".blur-sm");
      expect(glowElement).toBeInTheDocument();
      expect(glowElement).toHaveClass("bg-degraded");
    });

    it("shows glow when glow prop is true for down status", () => {
      const { container } = render(<StatusIndicator status="down" glow />);
      const glowElement = container.querySelector(".blur-sm");
      expect(glowElement).toBeInTheDocument();
      expect(glowElement).toHaveClass("bg-down");
    });

    it("does not show glow for unknown status even with glow prop", () => {
      const { container } = render(<StatusIndicator status="unknown" glow />);
      const glowElements = container.querySelectorAll(".blur-sm");
      expect(glowElements.length).toBe(0);
    });
  });

  describe("className merging", () => {
    it("applies custom className to wrapper", () => {
      const { container } = render(
        <StatusIndicator status="up" className="custom-class" />,
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });
  });
});

describe("StatusDot", () => {
  it("renders up status correctly", () => {
    render(<StatusDot status="up" />);
    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-up");
    expect(dot).toHaveClass("size-2");
  });

  it("renders degraded status correctly", () => {
    render(<StatusDot status="degraded" />);
    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-degraded");
  });

  it("renders down status correctly", () => {
    render(<StatusDot status="down" />);
    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-down");
  });

  it("renders unknown status correctly", () => {
    render(<StatusDot status="unknown" />);
    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-unknown");
    expect(dot).toHaveClass("opacity-50");
  });

  it("applies custom className", () => {
    render(<StatusDot status="up" className="custom-dot" />);
    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("custom-dot");
  });

  it("has correct aria-label", () => {
    render(<StatusDot status="up" />);
    const dot = screen.getByRole("status");
    expect(dot).toHaveAttribute("aria-label", "Status: up");
  });
});
