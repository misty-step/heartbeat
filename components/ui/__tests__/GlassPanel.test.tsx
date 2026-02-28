import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassPanel } from "../GlassPanel";

// GlassPanel is a deprecated shim — delegates to SurfacePanel (Field Design System)
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
    // Field: matte white surface, warm border
    expect(panel.className).toContain("bg-[var(--color-bg-elevated)]");
    expect(panel.className).toContain("border-[var(--color-border-subtle)]");
  });

  test("wraps children in content area", () => {
    const { container } = render(<GlassPanel>Content</GlassPanel>);
    // SurfacePanel wraps children in an inner content div
    const inner = container.querySelector(".p-6");
    expect(inner).toBeInTheDocument();
  });
});
