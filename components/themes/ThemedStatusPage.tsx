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
import { StatusPagePreviewBanner } from "@/components/StatusPagePreviewBanner";
import { Id } from "@/convex/_generated/dataModel";

export interface ThemedStatusPageProps extends StatusPageThemeProps {
  theme?: ThemeId | null;
  previewMode?: boolean;
  previewThemeId?: ThemeId;
  monitorId?: Id<"monitors">;
  statusSlug?: string;
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

export function ThemedStatusPage({
  theme,
  previewMode,
  previewThemeId,
  monitorId,
  statusSlug,
  ...props
}: ThemedStatusPageProps) {
  const ThemeComponent = theme ? THEME_COMPONENTS[theme] : GlassStatusPage;
  const Component = ThemeComponent ?? GlassStatusPage;

  const showPreviewBanner =
    previewMode && previewThemeId && monitorId && statusSlug;

  return (
    <>
      {showPreviewBanner && (
        <StatusPagePreviewBanner
          themeId={previewThemeId}
          monitorId={monitorId}
          statusSlug={statusSlug}
        />
      )}
      {/* Spacer to prevent banner from overlapping content */}
      {showPreviewBanner && <div className="h-12" />}
      <Component {...props} />
    </>
  );
}
