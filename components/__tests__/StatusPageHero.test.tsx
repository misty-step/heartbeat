import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusPageHero } from "../StatusPageHero";

describe("StatusPageHero", () => {
  const defaultProps = {
    status: "up" as const,
    monitorName: "API Server",
    uptimePercentage: 99.95,
  };

  describe("status messages", () => {
    it('renders "All Systems Operational" for status="up"', () => {
      render(<StatusPageHero {...defaultProps} status="up" />);
      expect(screen.getByText("All Systems Operational")).toBeInTheDocument();
    });

    it('renders "Experiencing Issues" for status="degraded"', () => {
      render(<StatusPageHero {...defaultProps} status="degraded" />);
      expect(screen.getByText("Experiencing Issues")).toBeInTheDocument();
    });

    it('renders "Service Disruption" for status="down"', () => {
      render(<StatusPageHero {...defaultProps} status="down" />);
      expect(screen.getByText("Service Disruption")).toBeInTheDocument();
    });
  });

  it("displays the monitor name", () => {
    render(<StatusPageHero {...defaultProps} monitorName="Production DB" />);
    expect(screen.getByText("Production DB")).toBeInTheDocument();
  });

  it("displays uptime percentage formatted to 2 decimals", () => {
    render(<StatusPageHero {...defaultProps} uptimePercentage={99.9} />);
    expect(screen.getByText("99.90%")).toBeInTheDocument();
  });

  describe("last check time", () => {
    it("shows last check time when provided", () => {
      const lastCheckAt = Date.now() - 60000; // 1 minute ago
      render(<StatusPageHero {...defaultProps} lastCheckAt={lastCheckAt} />);
      expect(screen.getByText(/Last checked/)).toBeInTheDocument();
    });

    it("hides last check time when undefined", () => {
      render(<StatusPageHero {...defaultProps} lastCheckAt={undefined} />);
      expect(screen.queryByText(/Last checked/)).not.toBeInTheDocument();
    });
  });
});
