/**
 * Shared SSRF-safe URL validation helpers.
 *
 * These helpers are consumed by both client and Convex code paths so
 * hostname blocking behavior stays identical everywhere.
 */

const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // AWS/cloud metadata
  /^0\.0\.0\.0$/,
  /^\[::1\]$/i, // IPv6 loopback
  /^\[::\]$/i, // IPv6 unspecified
  /^\[fe[89ab][0-9a-f:.]*\]$/i, // IPv6 link-local (fe80::/10)
  /^\[f[cd][0-9a-f:.]*\]$/i, // IPv6 unique local (fc00::/7)
  /^\[ff[0-9a-f:.]*\]$/i, // IPv6 multicast (ff00::/8)
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
];

function normalizeHostname(hostname: string): string {
  return hostname.replace(/\.+$/, "");
}

export function isInternalHostname(hostname: string): boolean {
  const normalizedHostname = normalizeHostname(hostname);
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) =>
    pattern.test(normalizedHostname),
  );
}

export function validateMonitorTargetUrl(url: string): string | null {
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
