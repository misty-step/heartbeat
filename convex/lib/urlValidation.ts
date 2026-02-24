/**
 * Server-side URL validation for SSRF protection.
 *
 * Blocks requests to internal/private network addresses to prevent
 * Server-Side Request Forgery attacks.
 */

import {
  isInternalHostname,
  validateMonitorTargetUrl,
} from "@/lib/domain/ssrf";

export type UrlAllowance =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Canonical SSRF gate for monitor targets.
 */
export function isAllowedUrl(url: string): UrlAllowance {
  const reason = validateMonitorTargetUrl(url);
  if (reason) {
    return { allowed: false, reason };
  }
  return { allowed: true };
}

/**
 * Backward-compatible validator that returns error string/null.
 */
export function validateMonitorUrl(url: string): string | null {
  const result = isAllowedUrl(url);
  return result.allowed ? null : result.reason;
}

export { isInternalHostname };
