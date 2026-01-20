import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ApdexScore, ApdexScoreCompact } from "../ApdexScore";

describe("ApdexScore", () => {
  describe("with no data", () => {
    it('displays "No data" message', () => {
      render(<ApdexScore responseTimes={[]} />);
      expect(screen.getByText("No data")).toBeInTheDocument();
    });
  });

  describe("with excellent rating", () => {
    it("displays score and Excellent label", () => {
      // All fast responses (< 200ms)
      render(<ApdexScore responseTimes={[50, 100, 150, 180]} />);
      expect(screen.getByText("1.00")).toBeInTheDocument();
      expect(screen.getByText("Excellent")).toBeInTheDocument();
    });

    it("uses up color for excellent rating", () => {
      render(<ApdexScore responseTimes={[100, 100, 100]} />);
      const scoreElement = screen.getByText("1.00");
      expect(scoreElement).toHaveClass("text-up");
    });
  });

  describe("with good rating", () => {
    it("displays score and Good label", () => {
      // 8 satisfied, 2 tolerating = (8 + 1) / 10 = 0.90
      render(
        <ApdexScore
          responseTimes={[100, 100, 100, 100, 100, 100, 100, 100, 500, 500]}
        />,
      );
      expect(screen.getByText("0.90")).toBeInTheDocument();
      expect(screen.getByText("Good")).toBeInTheDocument();
    });
  });

  describe("with fair rating", () => {
    it("displays score and Fair label with degraded color", () => {
      // 4 satisfied, 4 tolerating = (4 + 2) / 8 = 0.75
      render(
        <ApdexScore responseTimes={[100, 100, 100, 100, 500, 500, 500, 500]} />,
      );
      expect(screen.getByText("0.75")).toBeInTheDocument();
      expect(screen.getByText("Fair")).toBeInTheDocument();
      const scoreElement = screen.getByText("0.75");
      expect(scoreElement).toHaveClass("text-degraded");
    });
  });

  describe("with poor rating", () => {
    it("displays score and Poor label", () => {
      // All tolerating = (0 + 4/2) / 4 = 0.5
      render(<ApdexScore responseTimes={[500, 600, 700, 800]} />);
      expect(screen.getByText("0.50")).toBeInTheDocument();
      expect(screen.getByText("Poor")).toBeInTheDocument();
    });
  });

  describe("with unacceptable rating", () => {
    it("displays score and Critical label with down color", () => {
      // All frustrated (> 1000ms)
      render(<ApdexScore responseTimes={[1500, 2000, 3000]} />);
      expect(screen.getByText("0.00")).toBeInTheDocument();
      expect(screen.getByText("Critical")).toBeInTheDocument();
      const scoreElement = screen.getByText("0.00");
      expect(scoreElement).toHaveClass("text-down");
    });
  });

  describe("breakdown display", () => {
    it("does not show breakdown by default", () => {
      render(<ApdexScore responseTimes={[100, 500, 1500]} />);
      expect(screen.queryByText("satisfied")).not.toBeInTheDocument();
    });

    it("shows breakdown when showBreakdown is true", () => {
      // 1 satisfied, 1 tolerating, 1 frustrated
      const { container } = render(
        <ApdexScore responseTimes={[100, 500, 1500]} showBreakdown />,
      );
      // Breakdown section exists with count spans
      const breakdownSection = container.querySelector(".flex.gap-3.text-xs");
      expect(breakdownSection).toBeInTheDocument();
      expect(breakdownSection?.textContent).toContain("satisfied");
      expect(breakdownSection?.textContent).toContain("tolerating");
      expect(breakdownSection?.textContent).toContain("frustrated");
    });
  });

  describe("tooltip", () => {
    it("contains Apdex explanation text", () => {
      render(<ApdexScore responseTimes={[100]} />);
      expect(
        screen.getByText("Apdex (Application Performance Index)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /User satisfaction: 0 \(frustrated\) to 1 \(satisfied\)/,
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("ApdexScoreCompact", () => {
  it("displays dash for empty data", () => {
    render(<ApdexScoreCompact responseTimes={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("displays score only without label", () => {
    render(<ApdexScoreCompact responseTimes={[100, 100, 100]} />);
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(screen.queryByText("Excellent")).not.toBeInTheDocument();
  });

  it("applies correct color for rating", () => {
    render(<ApdexScoreCompact responseTimes={[100, 100, 100]} />);
    const score = screen.getByText("1.00");
    expect(score).toHaveClass("text-up");
    expect(score).toHaveClass("font-mono");
  });

  it("applies custom className", () => {
    render(
      <ApdexScoreCompact responseTimes={[100]} className="custom-class" />,
    );
    const score = screen.getByText("1.00");
    expect(score).toHaveClass("custom-class");
  });
});
