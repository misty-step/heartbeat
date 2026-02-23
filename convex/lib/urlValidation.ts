/**
 * Server-side URL validation for SSRF protection.
 *
 * Blocks requests to internal/private network addresses to prevent
 * Server-Side Request Forgery attacks.
 */

import { isInternalHostname } from "../../lib/domain/ssrf";

/**
 * Validate a URL is safe for server-side requests.
 * Returns error message or null if valid.
 */
export function validateMonitorUrl(url: string): string | null {
  if (!url) {
    return "URL is required";
  }

  if (!/^https?:\/\/.+/.test(url)) {
    return "URL must start with http:// or https://";
  }

  try {
    const parsed = new URL(url);
    if (isInternalHostname(parsed.hostname)) {
      return "URL cannot target internal networks";
    }
  } catch {
    return "Invalid URL format";
  }

  return null;
}

export { isInternalHostname };
