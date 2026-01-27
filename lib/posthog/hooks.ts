"use client";

import {
  useFeatureFlagEnabled,
  useFeatureFlagVariantKey,
} from "posthog-js/react";

export { usePostHog } from "posthog-js/react";

export function useFeatureFlag(flag: string, defaultValue = false): boolean {
  const enabled = useFeatureFlagEnabled(flag);
  return enabled ?? defaultValue;
}

export function useFeatureVariant(flag: string): string | undefined {
  const variant = useFeatureFlagVariantKey(flag);
  return typeof variant === "string" ? variant : undefined;
}
