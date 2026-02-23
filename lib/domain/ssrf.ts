export const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
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

export function isInternalHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
}
