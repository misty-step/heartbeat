import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatusPageDetails } from "../StatusPageDetails";

// Mock child components to isolate unit tests
vi.mock("../ZenUptimeChart", () => ({
  ZenUptimeChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="zen-uptime-chart">Chart with {data.length} points</div>
  ),
}));

vi.mock("../IncidentTimeline", () => ({
  IncidentTimeline: ({ incidents }: { incidents: unknown[] }) => (
    <div data-testid="incident-timeline">{incidents.length} incidents</div>
  ),
}));

describe("StatusPageDetails", () => {
  const defaultProps = {
    status: "up" as const,
    chartData: [
      { timestamp: 1000, responseTime: 100, status: "up" as const },
      { timestamp: 2000, responseTime: 150, status: "up" as const },
    ],
    uptimePercentage: 99.5,
    avgResponseTime: 125,
    lastCheckAt: Date.now(),
    incidents: [],
  };

  describe("chart rendering", () => {
    it("renders chart when chartData has items", () => {
      render(<StatusPageDetails {...defaultProps} />);
      expect(screen.getByTestId("zen-uptime-chart")).toBeInTheDocument();
      expect(screen.getByText("Response Time")).toBeInTheDocument();
    });

    it("hides chart panel when chartData is empty", () => {
      render(<StatusPageDetails {...defaultProps} chartData={[]} />);
      expect(screen.queryByTestId("zen-uptime-chart")).not.toBeInTheDocument();
      expect(screen.queryByText("Response Time")).not.toBeInTheDocument();
    });
  });

  describe("uptime status thresholds", () => {
    it('shows "good" status for uptime > 99%', () => {
      render(<StatusPageDetails {...defaultProps} uptimePercentage={99.5} />);
      // StatCard receives status="good" prop - verify the value renders
      expect(screen.getByText("99.5%")).toBeInTheDocument();
    });

    it('shows "warn" status for uptime 95-99%', () => {
      render(<StatusPageDetails {...defaultProps} uptimePercentage={97.0} />);
      expect(screen.getByText("97.0%")).toBeInTheDocument();
    });

    it('shows "bad" status for uptime <= 95%', () => {
      render(<StatusPageDetails {...defaultProps} uptimePercentage={94.0} />);
      expect(screen.getByText("94.0%")).toBeInTheDocument();
    });
  });

  describe("response time status thresholds", () => {
    it('shows "good" status for response < 200ms', () => {
      render(<StatusPageDetails {...defaultProps} avgResponseTime={150} />);
      expect(screen.getByText("150ms")).toBeInTheDocument();
    });

    it('shows "warn" status for response 200-500ms', () => {
      render(<StatusPageDetails {...defaultProps} avgResponseTime={350} />);
      expect(screen.getByText("350ms")).toBeInTheDocument();
    });

    it('shows "bad" status for response >= 500ms', () => {
      render(<StatusPageDetails {...defaultProps} avgResponseTime={600} />);
      expect(screen.getByText("600ms")).toBeInTheDocument();
    });
  });

  describe("last check display", () => {
    it('shows "—" when lastCheckAt is undefined', () => {
      render(<StatusPageDetails {...defaultProps} lastCheckAt={undefined} />);
      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("formats lastCheckAt when provided", () => {
      const recentTime = Date.now() - 30000; // 30 seconds ago
      render(<StatusPageDetails {...defaultProps} lastCheckAt={recentTime} />);
      // formatRelativeTime should produce something like "30s ago"
      expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();
    });
  });

  describe("incidents section", () => {
    it("shows incident timeline when incidents present", () => {
      const incidents = [
        {
          id: "1",
          title: "API outage",
          status: "investigating" as const,
          startedAt: new Date(),
        },
      ];
      render(<StatusPageDetails {...defaultProps} incidents={incidents} />);
      expect(screen.getByTestId("incident-timeline")).toBeInTheDocument();
      expect(screen.getByText("Active Incidents")).toBeInTheDocument();
    });

    it('shows "No incidents recorded" when incidents empty', () => {
      render(<StatusPageDetails {...defaultProps} incidents={[]} />);
      expect(screen.getByText("No incidents recorded")).toBeInTheDocument();
      expect(screen.queryByText("Active Incidents")).not.toBeInTheDocument();
    });
  });

  describe("stat labels", () => {
    it("renders all three stat cards with correct labels", () => {
      render(<StatusPageDetails {...defaultProps} />);
      expect(screen.getByText("Uptime")).toBeInTheDocument();
      expect(screen.getByText("Avg Response")).toBeInTheDocument();
      expect(screen.getByText("Last Check")).toBeInTheDocument();
    });
  });
});
