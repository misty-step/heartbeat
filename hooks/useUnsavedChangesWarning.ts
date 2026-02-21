import { useEffect } from "react";

/**
 * Warns users before navigating away when they have unsaved changes.
 * Attaches/detaches a beforeunload listener based on the hasChanges flag.
 */
export function useUnsavedChangesWarning(hasChanges: boolean): void {
  useEffect(() => {
    if (!hasChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);
}
