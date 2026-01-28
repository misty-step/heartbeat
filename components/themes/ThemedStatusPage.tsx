"use client";

import { type ThemeId } from "@/lib/themes";
import { type StatusPageThemeProps } from "./types";
import { GlassStatusPage } from "@/components/GlassStatusPage";
import { UkiyoStatusPage } from "./UkiyoStatusPage";
import { MemphisStatusPage } from "./MemphisStatusPage";
import { BlueprintStatusPage } from "./BlueprintStatusPage";
import { SwissStatusPage } from "./SwissStatusPage";
import { BroadsheetStatusPage } from "./BroadsheetStatusPage";
import { MissionControlStatusPage } from "./MissionControlStatusPage";

export interface ThemedStatusPageProps extends StatusPageThemeProps {
  theme?: ThemeId | null;
}

const THEME_COMPONENTS: Record<
  ThemeId,
  React.ComponentType<StatusPageThemeProps>
> = {
  glass: GlassStatusPage,
  ukiyo: UkiyoStatusPage,
  memphis: MemphisStatusPage,
  blueprint: BlueprintStatusPage,
  swiss: SwissStatusPage,
  broadsheet: BroadsheetStatusPage,
  "mission-control": MissionControlStatusPage,
};

export function ThemedStatusPage({ theme, ...props }: ThemedStatusPageProps) {
  const ThemeComponent = theme ? THEME_COMPONENTS[theme] : GlassStatusPage;
  const Component = ThemeComponent ?? GlassStatusPage;

  return <Component {...props} />;
}
