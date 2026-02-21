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
      // Allow modifier-clicks to open in new tab/window normally —
      // the user isn't leaving the current page
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;

      const anchor = (e.target as Element).closest("a[href]");
      if (!anchor) return;

      const href = (anchor as HTMLAnchorElement).getAttribute("href");
      // Only intercept internal Next.js paths (start with / but not //)
      // Reject protocol-relative URLs like //evil.com — they start with / but
      // route to external hosts when pushed via router.push().
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasChanges]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      const href = pendingNavigation;
      setPendingNavigation(null);
      router.push(href);
    }
  }, [pendingNavigation, router]);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  return { pendingNavigation, confirmNavigation, cancelNavigation };
}
