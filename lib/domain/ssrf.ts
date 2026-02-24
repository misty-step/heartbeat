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
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
];

const MAX_IPV4_DECIMAL = 0xffffffff;

function normalizeHostname(hostname: string): string {
  return hostname.trim().replace(/\.+$/, "").toLowerCase();
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

function isInternalIpv6(hostname: string): boolean {
  const normalized = stripIpv6Brackets(hostname);

  return (
    normalized === "::1" || // loopback
    normalized === "::" || // unspecified
    /^::ffff:/i.test(normalized) || // IPv4-mapped IPv6
    /^(fc|fd)[0-9a-f]{2}:/i.test(normalized) || // unique local fc00::/7
    /^fe[89ab][0-9a-f]:/i.test(normalized) || // link-local fe80::/10
    /^ff[0-9a-f]{2}:/i.test(normalized) // multicast ff00::/8
  );
}

function decodeDecimalIpv4(hostname: string): string | null {
  if (!/^\d+$/.test(hostname)) {
    return null;
  }

  const decimal = Number(hostname);
  if (!Number.isInteger(decimal) || decimal < 0 || decimal > MAX_IPV4_DECIMAL) {
    return null;
  }

  const a = (decimal >>> 24) & 0xff;
  const b = (decimal >>> 16) & 0xff;
  const c = (decimal >>> 8) & 0xff;
  const d = decimal & 0xff;

  return `${a}.${b}.${c}.${d}`;
}

export function isInternalHostname(hostname: string): boolean {
  const normalizedHostname = normalizeHostname(hostname);

  if (
    BLOCKED_HOSTNAME_PATTERNS.some((pattern) =>
      pattern.test(normalizedHostname),
    )
  ) {
    return true;
  }

  if (isInternalIpv6(normalizedHostname)) {
    return true;
  }

  const decodedIpv4 = decodeDecimalIpv4(normalizedHostname);
  if (decodedIpv4) {
    return BLOCKED_HOSTNAME_PATTERNS.some((pattern) =>
      pattern.test(decodedIpv4),
    );
  }

  return false;
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
