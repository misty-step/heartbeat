export const THEME_IDS = [
  "glass",
  "ukiyo",
  "memphis",
  "blueprint",
  "swiss",
  "broadsheet",
  "mission-control",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  minTier: "pulse" | "vital";
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  glass: {
    id: "glass",
    name: "Kyoto Moss",
    description: "Clean glass dashboard with bento grid layout",
    minTier: "pulse",
  },
  ukiyo: {
    id: "ukiyo",
    name: "Ukiyo Refined",
    description: "Bold outlines, flat colors, woodblock editorial aesthetic",
    minTier: "vital",
  },
  memphis: {
    id: "memphis",
    name: "Memphis Pop",
    description: "Playful, colorful 80s Memphis design movement",
    minTier: "vital",
  },
  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    description: "Technical engineering drawing aesthetic",
    minTier: "vital",
  },
  swiss: {
    id: "swiss",
    name: "Swiss Precision",
    description: "Minimalist International Typographic Style",
    minTier: "vital",
  },
  broadsheet: {
    id: "broadsheet",
    name: "Broadsheet",
    description: "Classic newspaper editorial layout",
    minTier: "vital",
  },
  "mission-control": {
    id: "mission-control",
    name: "Mission Control",
    description: "Retro NASA telemetry terminal aesthetic",
    minTier: "vital",
  },
};

export const DEFAULT_THEME: ThemeId = "glass";

export function getThemesForTier(tier: "pulse" | "vital"): ThemeDefinition[] {
  return Object.values(THEMES).filter((theme) => {
    if (tier === "vital") return true;
    return theme.minTier === "pulse";
  });
}

export function canUseTheme(theme: ThemeId, tier: "pulse" | "vital"): boolean {
  const themeDefn = THEMES[theme];
  if (!themeDefn) return false;
  if (tier === "vital") return true;
  return themeDefn.minTier === "pulse";
}

export function getThemeOrDefault(
  theme: ThemeId | undefined | null,
  tier: "pulse" | "vital",
): ThemeId {
  if (!theme) return DEFAULT_THEME;
  if (canUseTheme(theme, tier)) return theme;
  return DEFAULT_THEME;
}
