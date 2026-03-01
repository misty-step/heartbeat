import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusIndicator } from "../StatusIndicator";

describe("StatusIndicator", () => {
  it.each(["up", "degraded", "down"] as const)(
    "renders %s status with correct color class",
    (status) => {
      const { container } = render(<StatusIndicator status={status} />);
      expect(container.querySelector(`.bg-${status}`)).toBeInTheDocument();
    },
  );

  it("renders unknown status with muted color", () => {
    const { container } = render(<StatusIndicator status="unknown" />);
    const dot = container.querySelector(
      '[class*="bg-"][class*="color-text-muted"]',
    );
    expect(dot).toBeInTheDocument();
  });

  it("provides accessible status label via sr-only text", () => {
    render(<StatusIndicator status="up" />);
    expect(screen.getByText("Status: Operational")).toBeInTheDocument();
  });

  it("applies breathe animation only when status is up", () => {
    const { container, rerender } = render(<StatusIndicator status="up" />);
    expect(
      container.querySelector(".animate-km-breathe"),
    ).toBeInTheDocument();

    rerender(<StatusIndicator status="down" />);
    expect(
      container.querySelector(".animate-km-breathe"),
    ).not.toBeInTheDocument();
  });

  describe("cinematic mode", () => {
    it("renders glow effect for up status", () => {
      const { container } = render(
        <StatusIndicator status="up" cinematic />,
      );
      const glowDiv = container.querySelector(
        '[style*="shadow-glow"]',
      );
      expect(glowDiv).toBeInTheDocument();
    });

    it("renders pulse effect for down status", () => {
      const { container } = render(
        <StatusIndicator status="down" cinematic />,
      );
      expect(
        container.querySelector(".animate-pulse"),
      ).toBeInTheDocument();
    });

    it("does not render cinematic effects for degraded or unknown", () => {
      const { container: c1 } = render(
        <StatusIndicator status="degraded" cinematic />,
      );
      const { container: c2 } = render(
        <StatusIndicator status="unknown" cinematic />,
      );

      // No glow or pulse divs beyond the main dot
      for (const c of [c1, c2]) {
        expect(c.querySelector('[style*="shadow-glow"]')).not.toBeInTheDocument();
        expect(c.querySelector(".animate-pulse")).not.toBeInTheDocument();
      }
    });

    it("does not render cinematic effects when cinematic is false", () => {
      const { container } = render(
        <StatusIndicator status="up" cinematic={false} />,
      );
      expect(
        container.querySelector('[style*="shadow-glow"]'),
      ).not.toBeInTheDocument();
    });
  });
});
