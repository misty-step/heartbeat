import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  applyTokensToRoot,
  applyThemeMode,
  getToken,
  getTokens,
  generateCSSVariables,
  generateRootCSS,
  statusColorMap,
  getStatusClasses,
} from "../apply";
import type { DesignTokens } from "../tokens";

describe("applyTokensToRoot", () => {
  let originalDocument: typeof document;

  beforeEach(() => {
    // Mock document
    originalDocument = globalThis.document;
    const mockSetProperty = vi.fn();
    globalThis.document = {
      documentElement: {
        style: {
          setProperty: mockSetProperty,
        },
      },
    } as unknown as Document;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  it("sets CSS custom properties on document root", () => {
    const tokens = {
      "color-bg-primary": "#fff",
      "color-text-primary": "#000",
    } as DesignTokens;

    applyTokensToRoot(tokens);

    const mockSetProperty = document.documentElement.style
      .setProperty as ReturnType<typeof vi.fn>;
    expect(mockSetProperty).toHaveBeenCalledWith("--color-bg-primary", "#fff");
    expect(mockSetProperty).toHaveBeenCalledWith(
      "--color-text-primary",
      "#000",
    );
  });

  it("handles server-side rendering (no document)", () => {
    // @ts-expect-error - intentionally setting to undefined for SSR test
    globalThis.document = undefined;

    // Should not throw
    expect(() =>
      applyTokensToRoot({ "color-bg-primary": "#fff" } as DesignTokens),
    ).not.toThrow();
  });
});

describe("applyThemeMode", () => {
  let mockSetProperty: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetProperty = vi.fn();
    globalThis.document = {
      documentElement: {
        style: {
          setProperty: mockSetProperty,
        },
      },
    } as unknown as Document;
  });

  it("applies light mode tokens", () => {
    applyThemeMode("light");
    // Should have called setProperty for all tokens
    expect(mockSetProperty).toHaveBeenCalled();
  });

  it("applies dark mode tokens", () => {
    applyThemeMode("dark");
    expect(mockSetProperty).toHaveBeenCalled();
  });
});

describe("getToken", () => {
  it("returns token value for light mode by default", () => {
    const value = getToken("color-bg-primary");
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(0);
  });

  it("returns token value for specified mode", () => {
    const lightValue = getToken("color-bg-primary", "light");
    const darkValue = getToken("color-bg-primary", "dark");
    expect(typeof lightValue).toBe("string");
    expect(typeof darkValue).toBe("string");
  });
});

describe("getTokens", () => {
  it("returns all tokens for light mode by default", () => {
    const tokens = getTokens();
    expect(tokens).toHaveProperty("color-bg-primary");
    expect(tokens).toHaveProperty("color-text-primary");
  });

  it("returns all tokens for specified mode", () => {
    const lightTokens = getTokens("light");
    const darkTokens = getTokens("dark");
    expect(lightTokens).toHaveProperty("color-bg-primary");
    expect(darkTokens).toHaveProperty("color-bg-primary");
  });
});

describe("generateCSSVariables", () => {
  it("generates CSS variable declarations", () => {
    const css = generateCSSVariables("light");
    expect(css).toContain("--color-bg-primary:");
    expect(css).toContain("--color-text-primary:");
  });

  it("formats as key: value pairs with semicolons", () => {
    const css = generateCSSVariables("light");
    // Each line should be --key: value; (possibly with leading whitespace)
    const lines = css.split("\n");
    for (const line of lines) {
      expect(line).toMatch(/^\s*--[\w-]+: .+;$/);
    }
  });
});

describe("generateRootCSS", () => {
  it("generates :root block with light mode vars", () => {
    const css = generateRootCSS();
    expect(css).toContain(":root {");
    expect(css).toContain("--color-bg-primary:");
  });

  it("generates .dark block with dark mode vars", () => {
    const css = generateRootCSS();
    expect(css).toContain(".dark {");
  });

  it("produces valid CSS structure", () => {
    const css = generateRootCSS();
    // Should have both blocks
    expect(css.indexOf(":root")).toBeLessThan(css.indexOf(".dark"));
    // Should end properly
    expect(css.trim().endsWith("}")).toBe(true);
  });
});

describe("statusColorMap", () => {
  it("has correct colors for up status", () => {
    expect(statusColorMap.up.bg).toBe("var(--color-status-up)");
    expect(statusColorMap.up.bgMuted).toBe("var(--color-status-up-muted)");
  });

  it("has correct colors for degraded status", () => {
    expect(statusColorMap.degraded.bg).toBe("var(--color-status-degraded)");
    expect(statusColorMap.degraded.bgMuted).toBe(
      "var(--color-status-degraded-muted)",
    );
  });

  it("has correct colors for down status", () => {
    expect(statusColorMap.down.bg).toBe("var(--color-status-down)");
    expect(statusColorMap.down.bgMuted).toBe("var(--color-status-down-muted)");
  });

  it("has correct colors for unknown status", () => {
    expect(statusColorMap.unknown.bg).toBe("var(--color-text-muted)");
    expect(statusColorMap.unknown.bgMuted).toBe("var(--color-border-subtle)");
  });
});

describe("getStatusClasses", () => {
  it("returns correct classes for up status", () => {
    const classes = getStatusClasses("up");
    expect(classes.bg).toBe("var(--color-status-up)");
    expect(classes.bgMuted).toBe("var(--color-status-up-muted)");
  });

  it("returns correct classes for degraded status", () => {
    const classes = getStatusClasses("degraded");
    expect(classes.bg).toBe("var(--color-status-degraded)");
  });

  it("returns correct classes for down status", () => {
    const classes = getStatusClasses("down");
    expect(classes.bg).toBe("var(--color-status-down)");
  });

  it("returns correct classes for unknown status", () => {
    const classes = getStatusClasses("unknown");
    expect(classes.bg).toBe("var(--color-text-muted)");
  });
});
