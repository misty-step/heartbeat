import { describe, it, expect } from "vitest";
import {
  validateTheme,
  defineTheme,
  isThemePreset,
  type ThemeConfig,
} from "../schema";
import { REQUIRED_TOKENS, type DesignTokens } from "../tokens";

// Helper to create a complete token set for testing
function createCompleteTokens(): DesignTokens {
  return REQUIRED_TOKENS.reduce((acc, key) => {
    acc[key] = "test-value";
    return acc;
  }, {} as DesignTokens);
}

describe("validateTheme", () => {
  it("returns valid=true for a complete theme", () => {
    const config: ThemeConfig = {
      id: "test-theme",
      name: "Test Theme",
      tokens: {
        light: createCompleteTokens(),
        dark: createCompleteTokens(),
      },
    };

    const result = validateTheme(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for missing light mode tokens", () => {
    const incompleteTokens = { ...createCompleteTokens() };
    delete (incompleteTokens as Partial<DesignTokens>)["color-bg-primary"];

    const config: ThemeConfig = {
      id: "test-theme",
      name: "Test Theme",
      tokens: {
        light: incompleteTokens,
        dark: createCompleteTokens(),
      },
    };

    const result = validateTheme(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Theme "test-theme" missing token "color-bg-primary" in light mode',
    );
  });

  it("returns errors for missing dark mode tokens", () => {
    const incompleteTokens = { ...createCompleteTokens() };
    delete (incompleteTokens as Partial<DesignTokens>)["color-text-primary"];

    const config: ThemeConfig = {
      id: "test-theme",
      name: "Test Theme",
      tokens: {
        light: createCompleteTokens(),
        dark: incompleteTokens,
      },
    };

    const result = validateTheme(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Theme "test-theme" missing token "color-text-primary" in dark mode',
    );
  });

  it("returns errors for both modes when both are incomplete", () => {
    const incompleteLight = { ...createCompleteTokens() };
    delete (incompleteLight as Partial<DesignTokens>)["color-bg-primary"];

    const incompleteDark = { ...createCompleteTokens() };
    delete (incompleteDark as Partial<DesignTokens>)["color-text-primary"];

    const config: ThemeConfig = {
      id: "test-theme",
      name: "Test Theme",
      tokens: {
        light: incompleteLight,
        dark: incompleteDark,
      },
    };

    const result = validateTheme(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });
});

describe("defineTheme", () => {
  it("returns a valid ThemePreset for complete config", () => {
    const config: ThemeConfig = {
      id: "test-theme",
      name: "Test Theme",
      description: "A test theme",
      tokens: {
        light: createCompleteTokens(),
        dark: createCompleteTokens(),
      },
    };

    const theme = defineTheme(config);
    expect(theme.id).toBe("test-theme");
    expect(theme.name).toBe("Test Theme");
    expect(theme.description).toBe("A test theme");
    expect(theme.tokens.light).toBeDefined();
    expect(theme.tokens.dark).toBeDefined();
  });

  it("throws error for invalid config", () => {
    const incompleteTokens = {} as DesignTokens;

    const config: ThemeConfig = {
      id: "invalid-theme",
      name: "Invalid Theme",
      tokens: {
        light: incompleteTokens,
        dark: incompleteTokens,
      },
    };

    expect(() => defineTheme(config)).toThrow(/Invalid theme configuration/);
  });

  it("error message includes missing token names", () => {
    const incompleteTokens = {} as DesignTokens;

    const config: ThemeConfig = {
      id: "invalid-theme",
      name: "Invalid Theme",
      tokens: {
        light: incompleteTokens,
        dark: incompleteTokens,
      },
    };

    expect(() => defineTheme(config)).toThrow(/color-bg-primary/);
  });

  it("truncates error list after 5 errors", () => {
    const incompleteTokens = {} as DesignTokens;

    const config: ThemeConfig = {
      id: "invalid-theme",
      name: "Invalid Theme",
      tokens: {
        light: incompleteTokens,
        dark: incompleteTokens,
      },
    };

    try {
      defineTheme(config);
    } catch (e) {
      const error = e as Error;
      expect(error.message).toContain("and");
      expect(error.message).toContain("more");
    }
  });
});

describe("isThemePreset", () => {
  it("returns true for valid ThemePreset object", () => {
    const preset = {
      id: "test",
      name: "Test",
      tokens: {
        light: {},
        dark: {},
      },
    };
    expect(isThemePreset(preset)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isThemePreset(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isThemePreset(undefined)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(isThemePreset("string")).toBe(false);
    expect(isThemePreset(123)).toBe(false);
    expect(isThemePreset(true)).toBe(false);
  });

  it("returns false for missing id", () => {
    expect(isThemePreset({ name: "Test", tokens: {} })).toBe(false);
  });

  it("returns false for missing name", () => {
    expect(isThemePreset({ id: "test", tokens: {} })).toBe(false);
  });

  it("returns false for missing tokens", () => {
    expect(isThemePreset({ id: "test", name: "Test" })).toBe(false);
  });

  it("returns false for null tokens", () => {
    expect(isThemePreset({ id: "test", name: "Test", tokens: null })).toBe(
      false,
    );
  });
});
