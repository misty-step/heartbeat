import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Warns users before navigating away when they have unsaved changes.
 *
 * Guards two navigation paths:
 * 1. Browser unload (reload, tab close, external navigation) — via beforeunload
 * 2. In-app navigation (all Next.js Link clicks) — via document capture listener
 *
 * Returns state and actions to render a confirmation modal when in-app
 * navigation is intercepted.
 */
export function useUnsavedChangesWarning(hasChanges: boolean): {
  pendingNavigation: string | null;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
} {
  const router = useRouter();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  // Clear pending navigation when changes are saved or discarded
  useEffect(() => {
    if (!hasChanges) setPendingNavigation(null);
  }, [hasChanges]);

  // Guard 1: browser unload (reload / tab close / external URL)
  useEffect(() => {
    if (!hasChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  // Guard 2: all in-app anchor clicks, captured before Link's onClick fires.
  // This covers shared layout links (DashboardNavbar, Footer) that the settings
  // page cannot intercept via per-element onClick handlers.
  useEffect(() => {
    if (!hasChanges) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]");
      if (!anchor) return;

      const href = (anchor as HTMLAnchorElement).getAttribute("href");
      // Let external links and anchors through — beforeunload covers them
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        /^https?:\/\//.test(href)
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasChanges]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) router.push(pendingNavigation);
  }, [pendingNavigation, router]);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  return { pendingNavigation, confirmNavigation, cancelNavigation };
}
