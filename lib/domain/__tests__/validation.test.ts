import { describe, it, expect } from "vitest";
import {
  validateUrl,
  validateName,
  validateStatusCode,
  validateMonitorForm,
  generateSlug,
  extractNameFromUrl,
  isValidUrl,
} from "../validation";

describe("validateUrl", () => {
  it("returns error for empty URL", () => {
    expect(validateUrl("")).toBe("URL is required");
  });

  it("returns error for URL without protocol", () => {
    expect(validateUrl("example.com")).toBe(
      "URL must start with http:// or https://",
    );
    expect(validateUrl("www.example.com")).toBe(
      "URL must start with http:// or https://",
    );
  });

  it("returns null for valid HTTP URL", () => {
    expect(validateUrl("http://example.com")).toBeNull();
    expect(validateUrl("http://localhost:3000")).toBeNull();
  });

  it("returns null for valid HTTPS URL", () => {
    expect(validateUrl("https://example.com")).toBeNull();
    expect(validateUrl("https://api.example.com/health")).toBeNull();
  });
});

describe("validateName", () => {
  it("returns error for empty name", () => {
    expect(validateName("")).toBe("Name is required");
  });

  it("returns null for non-empty name", () => {
    expect(validateName("My Monitor")).toBeNull();
    expect(validateName("a")).toBeNull();
  });
});

describe("validateStatusCode", () => {
  it("returns null for empty status code (optional field)", () => {
    expect(validateStatusCode("")).toBeNull();
  });

  it("returns error for status code below 100", () => {
    expect(validateStatusCode("99")).toBe("Must be 100-599");
    expect(validateStatusCode("0")).toBe("Must be 100-599");
  });

  it("returns error for status code above 599", () => {
    expect(validateStatusCode("600")).toBe("Must be 100-599");
    expect(validateStatusCode("999")).toBe("Must be 100-599");
  });

  it("returns null for valid status codes", () => {
    expect(validateStatusCode("100")).toBeNull();
    expect(validateStatusCode("200")).toBeNull();
    expect(validateStatusCode("404")).toBeNull();
    expect(validateStatusCode("500")).toBeNull();
    expect(validateStatusCode("599")).toBeNull();
  });

  it("returns error for non-numeric values", () => {
    expect(validateStatusCode("abc")).toBe("Must be 100-599");
    expect(validateStatusCode("200a")).toBe("Must be 100-599");
  });
});

describe("validateMonitorForm", () => {
  it("returns valid for complete valid form", () => {
    const result = validateMonitorForm({
      url: "https://example.com",
      name: "My Monitor",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("returns errors for empty form", () => {
    const result = validateMonitorForm({
      url: "",
      name: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.url).toBe("URL is required");
    expect(result.errors.name).toBe("Name is required");
  });

  it("validates optional status code when provided", () => {
    const result = validateMonitorForm({
      url: "https://example.com",
      name: "My Monitor",
      expectedStatusCode: "999",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.expectedStatusCode).toBe("Must be 100-599");
  });

  it("accepts valid optional status code", () => {
    const result = validateMonitorForm({
      url: "https://example.com",
      name: "My Monitor",
      expectedStatusCode: "200",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});

describe("generateSlug", () => {
  it("converts to lowercase", () => {
    expect(generateSlug("My Monitor")).toBe("my-monitor");
  });

  it("replaces spaces with hyphens", () => {
    expect(generateSlug("my cool monitor")).toBe("my-cool-monitor");
  });

  it("removes special characters", () => {
    expect(generateSlug("my@monitor!")).toBe("mymonitor");
    expect(generateSlug("test.com")).toBe("testcom");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("my   monitor")).toBe("my-monitor");
    expect(generateSlug("my--monitor")).toBe("my-monitor");
  });

  it("trims leading and trailing hyphens", () => {
    expect(generateSlug("-my-monitor-")).toBe("my-monitor");
    expect(generateSlug("  my monitor  ")).toBe("my-monitor");
  });

  it('returns "monitor" for empty or whitespace-only input', () => {
    expect(generateSlug("")).toBe("monitor");
    expect(generateSlug("   ")).toBe("monitor");
    expect(generateSlug("@#$")).toBe("monitor");
  });
});

describe("extractNameFromUrl", () => {
  it("extracts hostname from URL", () => {
    expect(extractNameFromUrl("https://example.com")).toBe("example.com");
    expect(extractNameFromUrl("https://api.example.com/health")).toBe(
      "api.example.com",
    );
  });

  it("removes www prefix", () => {
    expect(extractNameFromUrl("https://www.example.com")).toBe("example.com");
  });

  it("returns empty string for invalid URL", () => {
    expect(extractNameFromUrl("not-a-url")).toBe("");
    expect(extractNameFromUrl("")).toBe("");
  });

  it("handles localhost", () => {
    expect(extractNameFromUrl("http://localhost:3000")).toBe("localhost");
  });
});

describe("isValidUrl", () => {
  it("returns true for valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });

  it("returns false for invalid URLs", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });
});
