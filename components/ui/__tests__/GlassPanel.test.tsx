import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassPanel } from "../GlassPanel";

describe("GlassPanel", () => {
  test("renders children correctly", () => {
    render(<GlassPanel>Test Content</GlassPanel>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    const { container } = render(
      <GlassPanel className="custom-class">Content</GlassPanel>,
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain("custom-class");
    // Uses solid background with border (no opacity)
    expect(panel.className).toContain("bg-[var(--color-bg-elevated)]");
    expect(panel.className).toContain("border-[var(--color-border-default)]");
  });

  test("contains glass styling elements", () => {
    const { container } = render(<GlassPanel>Content</GlassPanel>);
    // Check for top edge highlight (washi texture removed for visibility)
    const edgeHighlight = container.querySelector(".bg-gradient-to-r");
    expect(edgeHighlight).toBeInTheDocument();
  });
});
