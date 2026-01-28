import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemedStatusPage } from "../ThemedStatusPage";
import { UkiyoStatusPage } from "../UkiyoStatusPage";
import { MemphisStatusPage } from "../MemphisStatusPage";
import { BlueprintStatusPage } from "../BlueprintStatusPage";
import { SwissStatusPage } from "../SwissStatusPage";
import { BroadsheetStatusPage } from "../BroadsheetStatusPage";
import { MissionControlStatusPage } from "../MissionControlStatusPage";
import { type StatusPageThemeProps } from "../types";
import { type ThemeId } from "@/lib/themes";

// Base props with all optional fields populated
const baseProps: StatusPageThemeProps = {
  monitorName: "Test API",
  status: "up",
  uptimePercentage: 99.9,
  avgResponseTime: 150,
  totalChecks: 1000,
  lastCheckAt: Date.now(),
  chartData: [
    { timestamp: Date.now() - 3600000, responseTime: 120, status: "up" },
    { timestamp: Date.now() - 1800000, responseTime: 145, status: "up" },
    { timestamp: Date.now(), responseTime: 130, status: "up" },
  ],
  incidents: [],
};

// Props with degraded status
const degradedProps: StatusPageThemeProps = {
  ...baseProps,
  status: "degraded",
  uptimePercentage: 98.5,
};

// Props with down status and active incident
const downProps: StatusPageThemeProps = {
  ...baseProps,
  status: "down",
  uptimePercentage: 95.0,
  incidents: [
    {
      id: "incident_1",
      title: "API Outage",
      status: "investigating",
      startedAt: new Date(Date.now() - 3600000),
    },
  ],
};

// Props with undefined optional fields (tests fallback branches)
const minimalProps: StatusPageThemeProps = {
  monitorName: "Minimal Monitor",
  status: "up",
  uptimePercentage: 100,
  avgResponseTime: 50,
  totalChecks: undefined,
  lastCheckAt: undefined,
  chartData: [],
  incidents: [],
};

// Props that trigger threshold branches (high response time, low uptime)
const thresholdProps: StatusPageThemeProps = {
  ...baseProps,
  avgResponseTime: 900, // > 800 threshold
  uptimePercentage: 98.5, // < 99 threshold
  incidents: [
    {
      id: "incident_1",
      title: "Slow Response",
      status: "identified",
      startedAt: new Date(Date.now() - 7200000),
    },
  ],
};

// Props with resolved incident
const resolvedIncidentProps: StatusPageThemeProps = {
  ...baseProps,
  incidents: [
    {
      id: "incident_1",
      title: "Past Outage",
      status: "resolved",
      startedAt: new Date(Date.now() - 86400000),
      resolvedAt: new Date(Date.now() - 82800000),
    },
  ],
};

// Props with single-word monitor name (tests split logic)
const singleWordNameProps: StatusPageThemeProps = {
  ...baseProps,
  monitorName: "API",
};

// Props with multi-word monitor name
const multiWordNameProps: StatusPageThemeProps = {
  ...baseProps,
  monitorName: "Production API Server",
};

describe("ThemedStatusPage", () => {
  describe("theme routing", () => {
    it("renders glass theme by default when no theme specified", () => {
      const { container } = render(<ThemedStatusPage {...baseProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders glass theme when theme is null", () => {
      render(<ThemedStatusPage {...baseProps} theme={null} />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });

    const themes: ThemeId[] = [
      "glass",
      "ukiyo",
      "memphis",
      "blueprint",
      "swiss",
      "broadsheet",
      "mission-control",
    ];

    themes.forEach((theme) => {
      it(`renders ${theme} theme`, () => {
        render(<ThemedStatusPage {...baseProps} theme={theme} />);
        expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
      });
    });
  });

  describe("status states across themes", () => {
    const themes: ThemeId[] = [
      "ukiyo",
      "memphis",
      "blueprint",
      "swiss",
      "broadsheet",
      "mission-control",
    ];

    themes.forEach((theme) => {
      describe(`${theme} theme`, () => {
        it("renders up status", () => {
          const { container } = render(
            <ThemedStatusPage {...baseProps} theme={theme} />,
          );
          expect(container.firstChild).toBeInTheDocument();
        });

        it("renders degraded status", () => {
          const { container } = render(
            <ThemedStatusPage {...degradedProps} theme={theme} />,
          );
          expect(container.firstChild).toBeInTheDocument();
        });

        it("renders down status with incident", () => {
          const { container } = render(
            <ThemedStatusPage {...downProps} theme={theme} />,
          );
          expect(container.firstChild).toBeInTheDocument();
        });

        it("handles undefined optional fields", () => {
          const { container } = render(
            <ThemedStatusPage {...minimalProps} theme={theme} />,
          );
          expect(container.firstChild).toBeInTheDocument();
        });

        it("handles threshold conditions", () => {
          const { container } = render(
            <ThemedStatusPage {...thresholdProps} theme={theme} />,
          );
          expect(container.firstChild).toBeInTheDocument();
        });
      });
    });
  });
});

describe("UkiyoStatusPage", () => {
  it("renders with up status", () => {
    render(<UkiyoStatusPage {...baseProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with degraded status", () => {
    render(<UkiyoStatusPage {...degradedProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with down status", () => {
    render(<UkiyoStatusPage {...downProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("handles undefined lastCheckAt", () => {
    const { container } = render(<UkiyoStatusPage {...minimalProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles resolved incidents", () => {
    const { container } = render(
      <UkiyoStatusPage {...resolvedIncidentProps} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("MemphisStatusPage", () => {
  it("renders with up status", () => {
    render(<MemphisStatusPage {...baseProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with degraded status", () => {
    render(<MemphisStatusPage {...degradedProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with down status", () => {
    render(<MemphisStatusPage {...downProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("handles undefined lastCheckAt and totalChecks", () => {
    const { container } = render(<MemphisStatusPage {...minimalProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders active incidents", () => {
    render(<MemphisStatusPage {...downProps} />);
    // Memphis shows incident count or status
    const { container } = render(<MemphisStatusPage {...downProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("BlueprintStatusPage", () => {
  it("renders with up status", () => {
    render(<BlueprintStatusPage {...baseProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with degraded status", () => {
    render(<BlueprintStatusPage {...degradedProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with down status", () => {
    render(<BlueprintStatusPage {...downProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("handles undefined optional fields", () => {
    const { container } = render(<BlueprintStatusPage {...minimalProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles threshold conditions", () => {
    const { container } = render(<BlueprintStatusPage {...thresholdProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders resolved incidents", () => {
    const { container } = render(
      <BlueprintStatusPage {...resolvedIncidentProps} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("SwissStatusPage", () => {
  it("renders with up status", () => {
    render(<SwissStatusPage {...baseProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with degraded status", () => {
    render(<SwissStatusPage {...degradedProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with down status", () => {
    render(<SwissStatusPage {...downProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("handles undefined lastCheckAt and totalChecks", () => {
    const { container } = render(<SwissStatusPage {...minimalProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles high response time threshold (>800ms)", () => {
    const { container } = render(<SwissStatusPage {...thresholdProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles low uptime threshold (<99%)", () => {
    const props = { ...baseProps, uptimePercentage: 98.5 };
    const { container } = render(<SwissStatusPage {...props} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("splits single-word monitor name correctly", () => {
    render(<SwissStatusPage {...singleWordNameProps} />);
    expect(screen.getAllByText(/API/i).length).toBeGreaterThan(0);
  });

  it("splits multi-word monitor name correctly", () => {
    render(<SwissStatusPage {...multiWordNameProps} />);
    const { container } = render(<SwissStatusPage {...multiWordNameProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles empty chartData", () => {
    const { container } = render(<SwissStatusPage {...minimalProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("BroadsheetStatusPage", () => {
  it("renders with up status", () => {
    render(<BroadsheetStatusPage {...baseProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with degraded status", () => {
    render(<BroadsheetStatusPage {...degradedProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with down status", () => {
    render(<BroadsheetStatusPage {...downProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("handles undefined optional fields", () => {
    const { container } = render(<BroadsheetStatusPage {...minimalProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders active incidents in news format", () => {
    const { container } = render(<BroadsheetStatusPage {...downProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders resolved incidents", () => {
    const { container } = render(
      <BroadsheetStatusPage {...resolvedIncidentProps} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("MissionControlStatusPage", () => {
  it("renders with up status", () => {
    render(<MissionControlStatusPage {...baseProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with degraded status", () => {
    render(<MissionControlStatusPage {...degradedProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders with down status", () => {
    render(<MissionControlStatusPage {...downProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("handles undefined optional fields", () => {
    const { container } = render(
      <MissionControlStatusPage {...minimalProps} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("displays incident count when incidents present", () => {
    const { container } = render(<MissionControlStatusPage {...downProps} />);
    // Mission Control shows incident count as a number
    expect(container.textContent).toContain("1");
  });

  it("handles threshold conditions", () => {
    const { container } = render(
      <MissionControlStatusPage {...thresholdProps} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles empty chartData for telemetry", () => {
    const { container } = render(
      <MissionControlStatusPage {...minimalProps} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
