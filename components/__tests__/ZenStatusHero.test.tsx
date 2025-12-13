import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ZenStatusHero } from "../ZenStatusHero";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("ZenStatusHero", () => {
  const defaultProps = {
    status: "up" as const,
    monitorName: "API Server",
  };

  describe("status messages", () => {
    it('renders "All systems operational" for status="up"', () => {
      render(<ZenStatusHero {...defaultProps} status="up" />);
      expect(screen.getByText("All systems operational")).toBeInTheDocument();
    });

    it('renders "Performance degradation detected" for status="degraded"', () => {
      render(<ZenStatusHero {...defaultProps} status="degraded" />);
      expect(
        screen.getByText("Performance degradation detected"),
      ).toBeInTheDocument();
    });

    it('renders "Service outage in progress" for status="down"', () => {
      render(<ZenStatusHero {...defaultProps} status="down" />);
      expect(
        screen.getByText("Service outage in progress"),
      ).toBeInTheDocument();
    });
  });

  it("displays the monitor name", () => {
    render(<ZenStatusHero {...defaultProps} monitorName="Production DB" />);
    expect(screen.getByText("Production DB")).toBeInTheDocument();
  });

  describe("background images", () => {
    it("uses deer-01.webp for up status", () => {
      render(<ZenStatusHero {...defaultProps} status="up" />);
      const img = document.querySelector("img");
      expect(img?.getAttribute("src")).toBe("/images/deer-01.webp");
    });

    it("uses deer-alert-01.webp for degraded status", () => {
      render(<ZenStatusHero {...defaultProps} status="degraded" />);
      const img = document.querySelector("img");
      expect(img?.getAttribute("src")).toBe("/images/deer-alert-01.webp");
    });

    it("uses deer-thunder-01.webp for down status", () => {
      render(<ZenStatusHero {...defaultProps} status="down" />);
      const img = document.querySelector("img");
      expect(img?.getAttribute("src")).toBe("/images/deer-thunder-01.webp");
    });
  });

  it("renders scroll button with correct aria-label", () => {
    render(<ZenStatusHero {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Scroll to details" }),
    ).toBeInTheDocument();
  });

  it("renders header element as root", () => {
    render(<ZenStatusHero {...defaultProps} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
