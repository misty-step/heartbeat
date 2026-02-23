/**
 * Form validation utilities - pure functions for monitor form validation
 *
 * All validation functions are pure and can be tested without React.
 */

import { isInternalHostname } from "./ssrf";

export interface ValidationErrors {
  [key: string]: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrors;
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
