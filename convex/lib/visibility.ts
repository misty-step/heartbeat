/**
 * Visibility helper - Single source of truth for public visibility checks.
 *
 * Why this exists:
 * - During migration, `visibility` field may be undefined on legacy documents
 * - The check `monitor.visibility !== "public"` silently fails when undefined
 * - This helper makes the undefined behavior explicit and centralized
 *
 * Contract:
 * - null/undefined monitor → not public (safe)
 * - undefined visibility → not public (migration state, defaults private)
 * - visibility === "public" → public
 * - visibility === "private" → not public
 *
 * Type guard: Narrows to non-null monitor when returning true.
 */
export function isPubliclyVisible<
  T extends { visibility?: "public" | "private" },
>(monitor: T | null | undefined): monitor is T & { visibility: "public" } {
  if (!monitor) return false;
  return monitor.visibility === "public";
}
