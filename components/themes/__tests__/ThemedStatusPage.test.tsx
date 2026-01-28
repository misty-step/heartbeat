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

const mockProps: StatusPageThemeProps = {
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

const mockPropsWithIncident: StatusPageThemeProps = {
  ...mockProps,
  status: "down",
  incidents: [
    {
      id: "incident_1",
      title: "API Outage",
      status: "investigating",
      startedAt: new Date(Date.now() - 3600000),
    },
  ],
};

describe("ThemedStatusPage", () => {
  describe("theme routing", () => {
    it("renders glass theme by default when no theme specified", () => {
      const { container } = render(<ThemedStatusPage {...mockProps} />);
      // GlassStatusPage renders the content
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders glass theme when theme is null", () => {
      render(<ThemedStatusPage {...mockProps} theme={null} />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });

    it("renders ukiyo theme", () => {
      render(<ThemedStatusPage {...mockProps} theme="ukiyo" />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });

    it("renders memphis theme", () => {
      render(<ThemedStatusPage {...mockProps} theme="memphis" />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });

    it("renders blueprint theme", () => {
      render(<ThemedStatusPage {...mockProps} theme="blueprint" />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });

    it("renders swiss theme", () => {
      render(<ThemedStatusPage {...mockProps} theme="swiss" />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });

    it("renders broadsheet theme", () => {
      render(<ThemedStatusPage {...mockProps} theme="broadsheet" />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });

    it("renders mission-control theme", () => {
      render(<ThemedStatusPage {...mockProps} theme="mission-control" />);
      expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
    });
  });

  describe("status display", () => {
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
      it(`displays uptime percentage for ${theme} theme`, () => {
        render(<ThemedStatusPage {...mockProps} theme={theme} />);
        // Each theme should display the uptime percentage somewhere
        // Use getAllByText since some themes may display it multiple times
        const elements = screen.getAllByText(/99\.9/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });
});

describe("UkiyoStatusPage", () => {
  it("renders monitor name", () => {
    render(<UkiyoStatusPage {...mockProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders uptime percentage", () => {
    render(<UkiyoStatusPage {...mockProps} />);
    expect(screen.getAllByText(/99\.9/).length).toBeGreaterThan(0);
  });

  it("renders without crashing when incidents present", () => {
    const { container } = render(
      <UkiyoStatusPage {...mockPropsWithIncident} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("MemphisStatusPage", () => {
  it("renders monitor name", () => {
    render(<MemphisStatusPage {...mockProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders uptime percentage", () => {
    render(<MemphisStatusPage {...mockProps} />);
    expect(screen.getAllByText(/99\.9/).length).toBeGreaterThan(0);
  });

  it("renders without crashing when incidents present", () => {
    const { container } = render(
      <MemphisStatusPage {...mockPropsWithIncident} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("BlueprintStatusPage", () => {
  it("renders monitor name", () => {
    render(<BlueprintStatusPage {...mockProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders uptime percentage", () => {
    render(<BlueprintStatusPage {...mockProps} />);
    expect(screen.getAllByText(/99\.9/).length).toBeGreaterThan(0);
  });

  it("renders without crashing when incidents present", () => {
    const { container } = render(
      <BlueprintStatusPage {...mockPropsWithIncident} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("SwissStatusPage", () => {
  it("renders monitor name", () => {
    render(<SwissStatusPage {...mockProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders uptime percentage", () => {
    render(<SwissStatusPage {...mockProps} />);
    expect(screen.getAllByText(/99\.9/).length).toBeGreaterThan(0);
  });

  it("renders without crashing when incidents present", () => {
    const { container } = render(
      <SwissStatusPage {...mockPropsWithIncident} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("BroadsheetStatusPage", () => {
  it("renders monitor name", () => {
    render(<BroadsheetStatusPage {...mockProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders uptime percentage", () => {
    render(<BroadsheetStatusPage {...mockProps} />);
    expect(screen.getAllByText(/99\.9/).length).toBeGreaterThan(0);
  });

  it("renders without crashing when incidents present", () => {
    const { container } = render(
      <BroadsheetStatusPage {...mockPropsWithIncident} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("MissionControlStatusPage", () => {
  it("renders monitor name", () => {
    render(<MissionControlStatusPage {...mockProps} />);
    expect(screen.getAllByText("Test API").length).toBeGreaterThan(0);
  });

  it("renders uptime percentage", () => {
    render(<MissionControlStatusPage {...mockProps} />);
    expect(screen.getAllByText(/99\.9/).length).toBeGreaterThan(0);
  });

  it("renders without crashing when incidents present", () => {
    const { container } = render(
      <MissionControlStatusPage {...mockPropsWithIncident} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
