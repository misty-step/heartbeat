import { describe, it, expect } from "vitest";
import { REQUIRED_TOKENS } from "../tokens";

describe("REQUIRED_TOKENS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(REQUIRED_TOKENS)).toBe(true);
    expect(REQUIRED_TOKENS.length).toBeGreaterThan(0);
  });

  describe("background tokens", () => {
    it("includes all background tokens", () => {
      expect(REQUIRED_TOKENS).toContain("color-bg-primary");
      expect(REQUIRED_TOKENS).toContain("color-bg-secondary");
      expect(REQUIRED_TOKENS).toContain("color-bg-tertiary");
      expect(REQUIRED_TOKENS).toContain("color-bg-elevated");
      expect(REQUIRED_TOKENS).toContain("color-bg-inverse");
    });
  });

  describe("text tokens", () => {
    it("includes all text tokens", () => {
      expect(REQUIRED_TOKENS).toContain("color-text-primary");
      expect(REQUIRED_TOKENS).toContain("color-text-secondary");
      expect(REQUIRED_TOKENS).toContain("color-text-tertiary");
      expect(REQUIRED_TOKENS).toContain("color-text-muted");
      expect(REQUIRED_TOKENS).toContain("color-text-inverse");
    });
  });

  describe("status tokens", () => {
    it("includes all status tokens", () => {
      expect(REQUIRED_TOKENS).toContain("color-status-up");
      expect(REQUIRED_TOKENS).toContain("color-status-up-muted");
      expect(REQUIRED_TOKENS).toContain("color-status-degraded");
      expect(REQUIRED_TOKENS).toContain("color-status-degraded-muted");
      expect(REQUIRED_TOKENS).toContain("color-status-down");
      expect(REQUIRED_TOKENS).toContain("color-status-down-muted");
    });
  });

  describe("accent tokens", () => {
    it("includes all accent tokens", () => {
      expect(REQUIRED_TOKENS).toContain("color-accent-primary");
      expect(REQUIRED_TOKENS).toContain("color-accent-primary-hover");
      expect(REQUIRED_TOKENS).toContain("color-accent-secondary");
    });
  });

  describe("border tokens", () => {
    it("includes all border tokens", () => {
      expect(REQUIRED_TOKENS).toContain("color-border-subtle");
      expect(REQUIRED_TOKENS).toContain("color-border-default");
      expect(REQUIRED_TOKENS).toContain("color-border-strong");
    });
  });

  describe("typography tokens", () => {
    it("includes all typography tokens", () => {
      expect(REQUIRED_TOKENS).toContain("font-display");
      expect(REQUIRED_TOKENS).toContain("font-body");
      expect(REQUIRED_TOKENS).toContain("font-mono");
    });
  });

  describe("spacing tokens", () => {
    it("includes all spacing tokens", () => {
      expect(REQUIRED_TOKENS).toContain("spacing-xs");
      expect(REQUIRED_TOKENS).toContain("spacing-sm");
      expect(REQUIRED_TOKENS).toContain("spacing-md");
      expect(REQUIRED_TOKENS).toContain("spacing-lg");
      expect(REQUIRED_TOKENS).toContain("spacing-xl");
      expect(REQUIRED_TOKENS).toContain("spacing-2xl");
      expect(REQUIRED_TOKENS).toContain("spacing-3xl");
    });
  });

  describe("radius tokens", () => {
    it("includes all radius tokens", () => {
      expect(REQUIRED_TOKENS).toContain("radius-sm");
      expect(REQUIRED_TOKENS).toContain("radius-md");
      expect(REQUIRED_TOKENS).toContain("radius-lg");
      expect(REQUIRED_TOKENS).toContain("radius-xl");
      expect(REQUIRED_TOKENS).toContain("radius-full");
    });
  });

  describe("shadow tokens", () => {
    it("includes all shadow tokens", () => {
      expect(REQUIRED_TOKENS).toContain("shadow-sm");
      expect(REQUIRED_TOKENS).toContain("shadow-md");
      expect(REQUIRED_TOKENS).toContain("shadow-lg");
      expect(REQUIRED_TOKENS).toContain("shadow-glow");
    });
  });

  describe("motion tokens", () => {
    it("includes all duration tokens", () => {
      expect(REQUIRED_TOKENS).toContain("duration-instant");
      expect(REQUIRED_TOKENS).toContain("duration-fast");
      expect(REQUIRED_TOKENS).toContain("duration-normal");
      expect(REQUIRED_TOKENS).toContain("duration-slow");
      expect(REQUIRED_TOKENS).toContain("duration-breathe");
    });

    it("includes all easing tokens", () => {
      expect(REQUIRED_TOKENS).toContain("ease-default");
      expect(REQUIRED_TOKENS).toContain("ease-out");
      expect(REQUIRED_TOKENS).toContain("ease-breathe");
    });
  });

  describe("token uniqueness", () => {
    it("has no duplicate tokens", () => {
      const uniqueTokens = new Set(REQUIRED_TOKENS);
      expect(uniqueTokens.size).toBe(REQUIRED_TOKENS.length);
    });
  });
});
