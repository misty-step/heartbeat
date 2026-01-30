"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { THEMES, THEME_IDS, type ThemeId } from "@/lib/themes";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatusPagePreviewBannerProps {
  themeId: ThemeId;
  monitorId: Id<"monitors">;
  statusSlug: string;
}

function ColorDots({ colors }: { colors: readonly string[] }) {
  return (
    <div className="flex -space-x-1">
      {colors.map((color, i) => (
        <span
          key={i}
          className="size-3 rounded-full border border-white/50"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function StatusPagePreviewBanner({
  themeId,
  monitorId,
  statusSlug,
}: StatusPagePreviewBannerProps) {
  const router = useRouter();
  const updateMonitor = useMutation(api.monitors.update);
  const [isApplying, setIsApplying] = useState(false);

  const theme = THEMES[themeId];
  const currentIndex = THEME_IDS.indexOf(themeId);

  const switchTheme = (newThemeId: ThemeId) => {
    router.replace(`/status/${statusSlug}?preview=${newThemeId}`);
  };

  const handlePrev = () => {
    const prevIndex =
      currentIndex === 0 ? THEME_IDS.length - 1 : currentIndex - 1;
    switchTheme(THEME_IDS[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex =
      currentIndex === THEME_IDS.length - 1 ? 0 : currentIndex + 1;
    switchTheme(THEME_IDS[nextIndex]);
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await updateMonitor({
        id: monitorId,
        theme: themeId,
      });
      router.push(`/status/${statusSlug}`);
    } catch (error) {
      console.error("Failed to apply theme:", error);
      setIsApplying(false);
    }
  };

  const handleExit = () => {
    router.push(`/status/${statusSlug}`);
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Theme Switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Previous theme"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full min-w-[180px] justify-center">
            <ColorDots colors={theme.colors} />
            <span className="text-sm font-medium text-white">{theme.name}</span>
            {theme.minTier === "vital" && (
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/80 text-white rounded font-medium">
                VITAL
              </span>
            )}
          </div>

          <button
            onClick={handleNext}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Next theme"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Theme Pills - quick access */}
        <div className="hidden md:flex items-center gap-1">
          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            const isActive = id === themeId;
            return (
              <button
                key={id}
                onClick={() => switchTheme(id)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/10",
                )}
                title={t.name}
              >
                <ColorDots colors={t.colors} />
                {isActive && <span className="font-medium">{t.name}</span>}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="size-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-white text-gray-900 hover:bg-white/90 disabled:opacity-50 rounded transition-colors"
          >
            <Check className="size-3.5" />
            {isApplying ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
