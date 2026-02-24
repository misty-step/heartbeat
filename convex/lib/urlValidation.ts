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

/**
 * Validate a URL is safe for server-side requests.
 * Returns error message or null if valid.
 */
export function validateMonitorUrl(url: string): string | null {
  return validateMonitorTargetUrl(url);
}

export { isInternalHostname };
