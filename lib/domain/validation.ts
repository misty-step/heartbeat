/**
 * Form validation utilities - pure functions for monitor form validation
 *
 * All validation functions are pure and can be tested without React.
 */

export interface ValidationErrors {
  [key: string]: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrors;
}

/**
 * Patterns matching internal/private network hostnames.
 * Used to block SSRF attacks targeting internal infrastructure.
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
 * Validate a URL string.
 */
export function validateUrl(url: string): string | null {
  if (!url) return "URL is required";
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

/**
 * Validate a monitor name.
 */
export function validateName(name: string): string | null {
  if (!name) return "Name is required";
  return null;
}

/**
 * Validate an HTTP status code.
 */
export function validateStatusCode(code: string): string | null {
  if (!code) return null; // Optional field
  const num = Number(code);
  if (isNaN(num) || num < 100 || num > 599) {
    return "Must be 100-599";
  }
  return null;
}

/**
 * Monitor form data for validation.
 */
export interface MonitorFormData {
  url: string;
  name: string;
  expectedStatusCode?: string;
}

/**
 * Validate the full monitor form.
 */
export function validateMonitorForm(data: MonitorFormData): ValidationResult {
  const errors: ValidationErrors = {};

  const urlError = validateUrl(data.url);
  if (urlError) errors.url = urlError;

  const nameError = validateName(data.name);
  if (nameError) errors.name = nameError;

  if (data.expectedStatusCode) {
    const statusCodeError = validateStatusCode(data.expectedStatusCode);
    if (statusCodeError) errors.expectedStatusCode = statusCodeError;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Generate a URL-safe slug from text.
 */
export function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-|-$/g, "") || "monitor"
  );
}

/**
 * Extract a reasonable name from a URL.
 */
export function extractNameFromUrl(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Check if a string is a valid URL.
 */
export function isValidUrl(url: string): boolean {
  return validateUrl(url) === null;
}
