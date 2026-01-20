import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GlassStatusPage } from "../GlassStatusPage";

// Mock the formatting functions
vi.mock("@/lib/domain/formatting", () => ({
  formatRelativeTime: vi.fn((timestamp: number) => "2 minutes ago"),
  formatTimestamp: vi.fn((date: Date) => date.toISOString().split("T")[0]),
  calculateDuration: vi.fn((start: Date, end?: Date) =>
    end ? "12m" : "ongoing",
  ),
}));

const defaultProps = {
  monitorName: "Heartbeat API",
  status: "up" as const,
  uptimePercentage: 99.97,
  avgResponseTime: 142,
  chartData: [],
  incidents: [],
};

describe("GlassStatusPage", () => {
  describe("header", () => {
    it("renders monitor name", () => {
      render(<GlassStatusPage {...defaultProps} />);
      expect(screen.getByText("Heartbeat API")).toBeInTheDocument();
    });

    it("renders 'Real-time status' text", () => {
      render(<GlassStatusPage {...defaultProps} />);
      expect(screen.getByText(/Real-time status/)).toBeInTheDocument();
    });

    it("shows lastCheckAt timestamp when provided", () => {
      render(<GlassStatusPage {...defaultProps} lastCheckAt={Date.now()} />);
      expect(screen.getByText(/Updated 2 minutes ago/)).toBeInTheDocument();
    });

    it("does not show update time when lastCheckAt not provided", () => {
      render(<GlassStatusPage {...defaultProps} />);
      expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
    });
  });

  describe("status display", () => {
    it('renders "Operational" for status="up"', () => {
      render(<GlassStatusPage {...defaultProps} status="up" />);
      expect(screen.getByText("Operational")).toBeInTheDocument();
    });

    it('renders "Degraded" for status="degraded"', () => {
      render(<GlassStatusPage {...defaultProps} status="degraded" />);
      expect(screen.getByText("Degraded")).toBeInTheDocument();
    });

    it('renders "Outage" for status="down"', () => {
      render(<GlassStatusPage {...defaultProps} status="down" />);
      expect(screen.getByText("Outage")).toBeInTheDocument();
    });
  });

  describe("uptime card", () => {
    it("renders uptime percentage formatted to 2 decimal places", () => {
      render(<GlassStatusPage {...defaultProps} uptimePercentage={99.97} />);
      expect(screen.getByText("99.97")).toBeInTheDocument();
      expect(screen.getByText("%")).toBeInTheDocument();
    });

    it("renders uptime percentage with proper rounding", () => {
      render(<GlassStatusPage {...defaultProps} uptimePercentage={99.999} />);
      expect(screen.getByText("100.00")).toBeInTheDocument();
    });

    it("renders 30-Day Uptime label", () => {
      render(<GlassStatusPage {...defaultProps} />);
      expect(screen.getByText("30-Day Uptime")).toBeInTheDocument();
    });
  });

  describe("response time card", () => {
    it("renders average response time rounded to integer", () => {
      render(<GlassStatusPage {...defaultProps} avgResponseTime={142.7} />);
      expect(screen.getByText("143")).toBeInTheDocument();
      expect(screen.getByText("ms")).toBeInTheDocument();
    });

    it("calculates P95 from chartData", () => {
      const chartData = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - i * 60000,
        responseTime: 100 + i, // 100, 101, 102, ... 199
        status: "up" as const,
      }));
      render(<GlassStatusPage {...defaultProps} chartData={chartData} />);
      // P95 of 100-199 should be around 195
      expect(screen.getByText(/P95: 195ms/)).toBeInTheDocument();
    });

    it("uses avgResponseTime as fallback when chartData is empty", () => {
      render(
        <GlassStatusPage
          {...defaultProps}
          avgResponseTime={142}
          chartData={[]}
        />,
      );
      expect(screen.getByText(/P95: 142ms/)).toBeInTheDocument();
    });
  });

  describe("total checks card", () => {
    it("renders totalChecks when provided", () => {
      render(<GlassStatusPage {...defaultProps} totalChecks={12847} />);
      expect(screen.getByText("12,847")).toBeInTheDocument();
    });

    it("falls back to chartData.length when totalChecks not provided", () => {
      const chartData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - i * 60000,
        responseTime: 100,
        status: "up" as const,
      }));
      render(<GlassStatusPage {...defaultProps} chartData={chartData} />);
      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("renders Total Checks label", () => {
      render(<GlassStatusPage {...defaultProps} />);
      expect(screen.getByText("Total Checks")).toBeInTheDocument();
    });
  });

  describe("incidents card", () => {
    it("renders incident count", () => {
      const incidents = [
        {
          id: "1",
          title: "API latency spike",
          status: "resolved" as const,
          startedAt: new Date(),
        },
        {
          id: "2",
          title: "Database connection timeout",
          status: "resolved" as const,
          startedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      // Look for "2" in the incidents card specifically
      const incidentsLabel = screen.getByText("Incidents (90d)");
      const incidentsCard = incidentsLabel.closest("div");
      expect(incidentsCard).toHaveTextContent("2");
    });

    it("shows last incident title when incidents exist", () => {
      const incidents = [
        {
          id: "1",
          title: "API latency spike",
          status: "resolved" as const,
          startedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText(/Last: API latency spike/)).toBeInTheDocument();
    });

    it("does not show last incident when no incidents", () => {
      render(<GlassStatusPage {...defaultProps} incidents={[]} />);
      expect(screen.queryByText(/Last:/)).not.toBeInTheDocument();
    });
  });

  describe("uptime bar visualization", () => {
    it("renders bars for last 30 days of chartData", () => {
      const chartData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - i * 86400000,
        responseTime: 100,
        status: "up" as const,
      }));
      render(<GlassStatusPage {...defaultProps} chartData={chartData} />);
      // Should show "30 days ago" and "Today" labels
      expect(screen.getByText("30 days ago")).toBeInTheDocument();
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("does not render uptime bar when no chartData", () => {
      render(<GlassStatusPage {...defaultProps} chartData={[]} />);
      expect(screen.queryByText("30 days ago")).not.toBeInTheDocument();
    });
  });

  describe("incident history section", () => {
    it('shows "No incidents recorded" when no incidents', () => {
      render(<GlassStatusPage {...defaultProps} incidents={[]} />);
      expect(
        screen.getByText("No incidents recorded in the last 90 days"),
      ).toBeInTheDocument();
    });

    it("shows incident history section when incidents exist", () => {
      const incidents = [
        {
          id: "1",
          title: "API latency spike",
          status: "resolved" as const,
          startedAt: new Date("2024-01-15"),
          resolvedAt: new Date("2024-01-15"),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("Incident History")).toBeInTheDocument();
      expect(screen.getByText("API latency spike")).toBeInTheDocument();
    });

    it("renders incident with investigating status", () => {
      const incidents = [
        {
          id: "1",
          title: "Investigating issue",
          status: "investigating" as const,
          startedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("Investigating")).toBeInTheDocument();
    });

    it("renders incident with identified status", () => {
      const incidents = [
        {
          id: "1",
          title: "Identified issue",
          status: "identified" as const,
          startedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("Identified")).toBeInTheDocument();
    });

    it("renders incident with monitoring status", () => {
      const incidents = [
        {
          id: "1",
          title: "Monitoring issue",
          status: "monitoring" as const,
          startedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("Monitoring")).toBeInTheDocument();
    });

    it("renders incident with resolved status", () => {
      const incidents = [
        {
          id: "1",
          title: "Resolved issue",
          status: "resolved" as const,
          startedAt: new Date(),
          resolvedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("Resolved")).toBeInTheDocument();
    });

    it("shows duration for incidents", () => {
      const incidents = [
        {
          id: "1",
          title: "Resolved issue",
          status: "resolved" as const,
          startedAt: new Date(),
          resolvedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("12m")).toBeInTheDocument();
    });

    it("renders incident updates when present", () => {
      const incidents = [
        {
          id: "1",
          title: "Issue with updates",
          status: "investigating" as const,
          startedAt: new Date(),
          updates: [
            { message: "Looking into the issue", timestamp: new Date() },
            { message: "Root cause identified", timestamp: new Date() },
          ],
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("Looking into the issue")).toBeInTheDocument();
      expect(screen.getByText("Root cause identified")).toBeInTheDocument();
    });
  });

  describe("multiple incidents", () => {
    it("renders all incidents in the history", () => {
      const incidents = [
        {
          id: "1",
          title: "First incident",
          status: "resolved" as const,
          startedAt: new Date(),
          resolvedAt: new Date(),
        },
        {
          id: "2",
          title: "Second incident",
          status: "resolved" as const,
          startedAt: new Date(),
          resolvedAt: new Date(),
        },
        {
          id: "3",
          title: "Third incident",
          status: "investigating" as const,
          startedAt: new Date(),
        },
      ];
      render(<GlassStatusPage {...defaultProps} incidents={incidents} />);
      expect(screen.getByText("First incident")).toBeInTheDocument();
      expect(screen.getByText("Second incident")).toBeInTheDocument();
      expect(screen.getByText("Third incident")).toBeInTheDocument();
    });
  });
});
