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
    expect(panel.className).toContain("backdrop-blur-xl");
  });

  test("contains glass styling elements", () => {
    const { container } = render(<GlassPanel>Content</GlassPanel>);
    // Check for noise texture overlay
    const noiseTexture = container.querySelector(".noise-texture");
    expect(noiseTexture).toBeInTheDocument();
    // Check for top edge highlight
    const edgeHighlight = container.querySelector(".bg-gradient-to-r");
    expect(edgeHighlight).toBeInTheDocument();
  });
});
