import { describe, it, expect } from "vitest";
import {
  THEME_IDS,
  THEMES,
  DEFAULT_THEME,
  getThemesForTier,
  canUsetheme,
  getThemeOrDefault,
  type ThemeId,
} from "../themes";

describe("lib/themes", () => {
  describe("constants", () => {
    it("exports THEME_IDS array with all theme identifiers", () => {
      expect(THEME_IDS).toEqual([
        "glass",
        "ukiyo",
        "memphis",
        "blueprint",
        "swiss",
        "broadsheet",
        "mission-control",
      ]);
    });

    it("exports THEMES record with definitions for each theme", () => {
      expect(Object.keys(THEMES)).toHaveLength(7);
      THEME_IDS.forEach((id) => {
        expect(THEMES[id]).toBeDefined();
        expect(THEMES[id].id).toBe(id);
        expect(THEMES[id].name).toBeDefined();
        expect(THEMES[id].description).toBeDefined();
        expect(["pulse", "vital"]).toContain(THEMES[id].minTier);
      });
    });

    it("has glass as the default theme", () => {
      expect(DEFAULT_THEME).toBe("glass");
    });

    it("glass theme requires pulse tier (free tier available)", () => {
      expect(THEMES.glass.minTier).toBe("pulse");
    });

    it("premium themes require vital tier", () => {
      const premiumThemes: ThemeId[] = [
        "ukiyo",
        "memphis",
        "blueprint",
        "swiss",
        "broadsheet",
        "mission-control",
      ];
      premiumThemes.forEach((id) => {
        expect(THEMES[id].minTier).toBe("vital");
      });
    });
  });

  describe("getThemesForTier", () => {
    it("returns only pulse-tier themes for pulse users", () => {
      const pulseThemes = getThemesForTier("pulse");
      expect(pulseThemes).toHaveLength(1);
      expect(pulseThemes[0].id).toBe("glass");
    });

    it("returns all themes for vital users", () => {
      const vitalThemes = getThemesForTier("vital");
      expect(vitalThemes).toHaveLength(7);
      expect(vitalThemes.map((t) => t.id).sort()).toEqual(
        [...THEME_IDS].sort(),
      );
    });
  });

  describe("canUsetheme", () => {
    it("allows glass theme for pulse tier", () => {
      expect(canUsetheme("glass", "pulse")).toBe(true);
    });

    it("denies premium themes for pulse tier", () => {
      const premiumThemes: ThemeId[] = [
        "ukiyo",
        "memphis",
        "blueprint",
        "swiss",
        "broadsheet",
        "mission-control",
      ];
      premiumThemes.forEach((id) => {
        expect(canUsetheme(id, "pulse")).toBe(false);
      });
    });

    it("allows all themes for vital tier", () => {
      THEME_IDS.forEach((id) => {
        expect(canUsetheme(id, "vital")).toBe(true);
      });
    });

    it("returns false for unknown theme id", () => {
      // @ts-expect-error - testing invalid input
      expect(canUsetheme("nonexistent", "vital")).toBe(false);
    });
  });

  describe("getThemeOrDefault", () => {
    it("returns default theme when input is undefined", () => {
      expect(getThemeOrDefault(undefined, "pulse")).toBe("glass");
    });

    it("returns default theme when input is null", () => {
      expect(getThemeOrDefault(null, "pulse")).toBe("glass");
    });

    it("returns requested theme when user has access", () => {
      expect(getThemeOrDefault("glass", "pulse")).toBe("glass");
      expect(getThemeOrDefault("ukiyo", "vital")).toBe("ukiyo");
      expect(getThemeOrDefault("memphis", "vital")).toBe("memphis");
    });

    it("falls back to default when user lacks access", () => {
      expect(getThemeOrDefault("ukiyo", "pulse")).toBe("glass");
      expect(getThemeOrDefault("memphis", "pulse")).toBe("glass");
      expect(getThemeOrDefault("mission-control", "pulse")).toBe("glass");
    });
  });
});
