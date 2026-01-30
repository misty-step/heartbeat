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
  /** Representative colors for visual preview (4 colors) */
  colors: [string, string, string, string];
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  glass: {
    id: "glass",
    name: "Kyoto Moss",
    description: "Clean glass dashboard with bento grid layout",
    minTier: "pulse",
    colors: ["#2d4a3e", "#22c55e", "#f59e0b", "#ef4444"],
  },
  ukiyo: {
    id: "ukiyo",
    name: "Ukiyo Refined",
    description: "Bold outlines, flat colors, woodblock editorial aesthetic",
    minTier: "vital",
    colors: ["#2d4a3e", "#a94442", "#fdfcfa", "#1a1a1a"],
  },
  memphis: {
    id: "memphis",
    name: "Memphis Pop",
    description: "Playful, colorful 80s Memphis design movement",
    minTier: "vital",
    colors: ["#ff6b9d", "#00d4ff", "#ffd93d", "#a855f7"],
  },
  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    description: "Technical engineering drawing aesthetic",
    minTier: "vital",
    colors: ["#1e3a5f", "#60a5fa", "#fbbf24", "#f87171"],
  },
  swiss: {
    id: "swiss",
    name: "Swiss Precision",
    description: "Minimalist International Typographic Style",
    minTier: "vital",
    colors: ["#e30613", "#1a1a1a", "#f5f5f5", "#ffffff"],
  },
  broadsheet: {
    id: "broadsheet",
    name: "Broadsheet",
    description: "Classic newspaper editorial layout",
    minTier: "vital",
    colors: ["#1a1a1a", "#f5f2eb", "#c41e3a", "#1e3a5f"],
  },
  "mission-control": {
    id: "mission-control",
    name: "Mission Control",
    description: "Retro NASA telemetry terminal aesthetic",
    minTier: "vital",
    colors: ["#0a0f0a", "#33ff00", "#ffb000", "#ff3300"],
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
