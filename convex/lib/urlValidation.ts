/**
 * Server-side URL validation for SSRF protection.
 *
 * Blocks requests to internal/private network addresses to prevent
 * Server-Side Request Forgery attacks.
 */

/**
 * Patterns matching internal/private network hostnames.
 */
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // AWS/cloud metadata
  /^0\.0\.0\.0$/,
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
];

/**
 * Check if a hostname targets internal/private networks.
 */
export function isInternalHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
}

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
