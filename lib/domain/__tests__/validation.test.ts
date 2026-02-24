import { describe, it, expect } from "vitest";
import {
  validateUrl,
  validateName,
  validateStatusCode,
  validateMonitorForm,
  generateSlug,
  extractNameFromUrl,
  isValidUrl,
  isInternalHostname,
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
  });

  it("returns null for valid HTTPS URL", () => {
    expect(validateUrl("https://example.com")).toBeNull();
    expect(validateUrl("https://api.example.com/health")).toBeNull();
  });

  it("blocks localhost URLs (SSRF protection)", () => {
    expect(validateUrl("http://localhost")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://localhost:3000")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("https://localhost/path")).toBe(
      "URL cannot target internal networks",
    );
  });

  it("blocks loopback IPs (SSRF protection)", () => {
    expect(validateUrl("http://127.0.0.1")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://127.0.0.1:8080")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://127.255.255.255")).toBe(
      "URL cannot target internal networks",
    );
  });

  it("blocks private network IPs (SSRF protection)", () => {
    // 10.x.x.x range
    expect(validateUrl("http://10.0.0.1")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://10.255.255.255")).toBe(
      "URL cannot target internal networks",
    );

    // 172.16-31.x.x range
    expect(validateUrl("http://172.16.0.1")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://172.31.255.255")).toBe(
      "URL cannot target internal networks",
    );

    // 192.168.x.x range
    expect(validateUrl("http://192.168.0.1")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://192.168.255.255")).toBe(
      "URL cannot target internal networks",
    );
  });

  it("blocks cloud metadata IPs (SSRF protection)", () => {
    expect(validateUrl("http://169.254.169.254")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://169.254.169.254/latest/meta-data/")).toBe(
      "URL cannot target internal networks",
    );
  });

  it("blocks special internal hostnames (SSRF protection)", () => {
    expect(validateUrl("http://0.0.0.0")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://internal.local")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://api.internal")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://test.localhost")).toBe(
      "URL cannot target internal networks",
    );
  });

  it("blocks internal IPv6 URLs (SSRF protection)", () => {
    expect(validateUrl("http://[::1]")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://[::]")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://[fc00::1]")).toBe(
      "URL cannot target internal networks",
    );
    expect(validateUrl("http://[fe80::1]")).toBe(
      "URL cannot target internal networks",
    );
  });

  it("allows valid public IPs", () => {
    expect(validateUrl("http://8.8.8.8")).toBeNull();
    expect(validateUrl("http://1.1.1.1")).toBeNull();
    expect(validateUrl("https://142.250.80.46")).toBeNull();
    expect(validateUrl("https://[2001:4860:4860::8888]")).toBeNull();
  });

  it("allows 172.x.x.x outside private range", () => {
    // 172.15.x.x is NOT private
    expect(validateUrl("http://172.15.0.1")).toBeNull();
    // 172.32.x.x is NOT private
    expect(validateUrl("http://172.32.0.1")).toBeNull();
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
    expect(isValidUrl("http://api.example.com")).toBe(true);
  });

  it("returns false for invalid URLs", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("returns false for internal network URLs", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(false);
    expect(isValidUrl("http://127.0.0.1")).toBe(false);
    expect(isValidUrl("http://192.168.1.1")).toBe(false);
  });
});

describe("isInternalHostname", () => {
  it("identifies localhost variants", () => {
    expect(isInternalHostname("localhost")).toBe(true);
    expect(isInternalHostname("LOCALHOST")).toBe(true);
    expect(isInternalHostname("test.localhost")).toBe(true);
  });

  it("identifies loopback addresses", () => {
    expect(isInternalHostname("127.0.0.1")).toBe(true);
    expect(isInternalHostname("127.255.255.255")).toBe(true);
  });

  it("identifies private 10.x.x.x range", () => {
    expect(isInternalHostname("10.0.0.1")).toBe(true);
    expect(isInternalHostname("10.255.255.255")).toBe(true);
  });

  it("identifies private 172.16-31.x.x range", () => {
    expect(isInternalHostname("172.16.0.1")).toBe(true);
    expect(isInternalHostname("172.31.255.255")).toBe(true);
  });

  it("does not block 172.x.x.x outside private range", () => {
    expect(isInternalHostname("172.15.0.1")).toBe(false);
    expect(isInternalHostname("172.32.0.1")).toBe(false);
  });

  it("identifies private 192.168.x.x range", () => {
    expect(isInternalHostname("192.168.0.1")).toBe(true);
    expect(isInternalHostname("192.168.255.255")).toBe(true);
  });

  it("identifies cloud metadata IP", () => {
    expect(isInternalHostname("169.254.169.254")).toBe(true);
  });

  it("identifies special internal TLDs", () => {
    expect(isInternalHostname("service.local")).toBe(true);
    expect(isInternalHostname("api.internal")).toBe(true);
    expect(isInternalHostname("app.localhost")).toBe(true);
  });

  it("identifies internal IPv6 hostnames", () => {
    expect(isInternalHostname("[::1]")).toBe(true);
    expect(isInternalHostname("[::]")).toBe(true);
    expect(isInternalHostname("[fc00::1]")).toBe(true);
    expect(isInternalHostname("[fe80::1]")).toBe(true);
    expect(isInternalHostname("[ff02::1]")).toBe(true);
  });

  it("allows public hostnames", () => {
    expect(isInternalHostname("example.com")).toBe(false);
    expect(isInternalHostname("api.github.com")).toBe(false);
    expect(isInternalHostname("8.8.8.8")).toBe(false);
    expect(isInternalHostname("[2001:4860:4860::8888]")).toBe(false);
  });
});
