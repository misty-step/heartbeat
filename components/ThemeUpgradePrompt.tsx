"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { THEMES, type ThemeId } from "@/lib/themes";
import { Sparkles, X } from "lucide-react";
import { usePostHog } from "posthog-js/react";

interface ThemeUpgradePromptProps {
  themeId: ThemeId;
  onKeepCurrent: () => void;
  onClose: () => void;
}

export function ThemeUpgradePrompt({
  themeId,
  onKeepCurrent,
  onClose,
}: ThemeUpgradePromptProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const theme = THEMES[themeId];

  // Track prompt shown event
  useEffect(() => {
    posthog?.capture("theme_upgrade_prompt_shown", {
      theme_id: themeId,
      theme_name: theme.name,
    });
  }, [posthog, themeId, theme.name]);

  const handleUpgrade = useCallback(() => {
    posthog?.capture("theme_upgrade_clicked", {
      theme_id: themeId,
      theme_name: theme.name,
    });
    router.push(`/dashboard/settings/billing?theme=${themeId}`);
    onClose();
  }, [router, posthog, themeId, theme.name, onClose]);

  const handleKeepCurrent = useCallback(() => {
    posthog?.capture("theme_upgrade_dismissed", {
      theme_id: themeId,
      theme_name: theme.name,
    });
    onKeepCurrent();
  }, [posthog, themeId, theme.name, onKeepCurrent]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleKeepCurrent();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleKeepCurrent]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleKeepCurrent();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 bg-[var(--color-bg-primary)] shadow-[var(--shadow-lg)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
        {/* Close button */}
        <button
          onClick={handleKeepCurrent}
          className="absolute top-4 right-4 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded-[var(--radius-sm)]"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          {/* Theme color preview */}
          <div className="flex justify-center gap-1.5 mb-6">
            {theme.colors.map((color, i) => (
              <span
                key={i}
                className="size-6 rounded-full border border-[var(--color-border-subtle)]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <h2 className="font-display text-xl text-[var(--color-text-primary)] mb-2">
            {theme.name} looks great!
          </h2>

          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Premium themes are included with Vital.
          </p>

          {/* Pricing */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-tertiary)] rounded-full mb-6">
            <Sparkles className="size-4 text-[var(--color-accent-secondary)]" />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              $29/month
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              · 14-day free trial
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              className="w-full px-6 py-3 bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] font-medium hover:opacity-90 transition-opacity rounded-[var(--radius-md)]"
            >
              Upgrade to Vital
            </button>
            <button
              onClick={handleKeepCurrent}
              className="w-full px-6 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded-[var(--radius-md)]"
            >
              Keep Current Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
