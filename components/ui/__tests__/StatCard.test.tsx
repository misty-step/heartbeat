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
    expect(card.className).toContain("ring-emerald-500/20");
  });

  test("applies warn status accent color", () => {
    const { container } = render(
      <StatCard label="Status" value="Degraded" status="warn" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("ring-amber-500/20");
  });

  test("applies bad status accent color", () => {
    const { container } = render(
      <StatCard label="Status" value="Down" status="bad" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("ring-red-500/20");
  });

  test("uses default ring when no status provided", () => {
    const { container } = render(<StatCard label="Metric" value="100" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("ring-white/10");
  });
});
