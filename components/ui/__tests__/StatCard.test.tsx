import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../StatCard";

describe("StatCard", () => {
  test("renders label and value correctly", () => {
    render(<StatCard label="Uptime" value="99.9%" />);
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
  });

  test("applies good status accent color", () => {
    const { container } = render(
      <StatCard label="Status" value="OK" status="good" />,
    );
    const card = container.firstChild as HTMLElement;
    // Solid border color, no opacity
    expect(card.className).toContain("border-[var(--color-status-up)]");
  });

  test("applies warn status accent color", () => {
    const { container } = render(
      <StatCard label="Status" value="Degraded" status="warn" />,
    );
    const card = container.firstChild as HTMLElement;
    // Solid border color, no opacity
    expect(card.className).toContain("border-[var(--color-status-degraded)]");
  });

  test("applies bad status accent color", () => {
    const { container } = render(
      <StatCard label="Status" value="Down" status="bad" />,
    );
    const card = container.firstChild as HTMLElement;
    // Solid border color, no opacity
    expect(card.className).toContain("border-[var(--color-status-down)]");
  });

  test("uses default border when no status provided", () => {
    const { container } = render(<StatCard label="Metric" value="100" />);
    const card = container.firstChild as HTMLElement;
    // Solid border color, no opacity
    expect(card.className).toContain("border-[var(--color-border-default)]");
  });
});
