import { describe, it, expect } from "vitest";
import { isInternalHostname, validateMonitorUrl } from "../urlValidation";

describe("isInternalHostname", () => {
  describe("blocks internal hostnames", () => {
    it("blocks localhost", () => {
      expect(isInternalHostname("localhost")).toBe(true);
      expect(isInternalHostname("LOCALHOST")).toBe(true);
    });

    it("blocks loopback addresses (127.x.x.x)", () => {
      expect(isInternalHostname("127.0.0.1")).toBe(true);
      expect(isInternalHostname("127.255.255.255")).toBe(true);
    });

    it("blocks private 10.x.x.x range", () => {
      expect(isInternalHostname("10.0.0.1")).toBe(true);
      expect(isInternalHostname("10.255.255.255")).toBe(true);
    });

    it("blocks private 172.16-31.x.x range", () => {
      expect(isInternalHostname("172.16.0.1")).toBe(true);
      expect(isInternalHostname("172.31.255.255")).toBe(true);
    });

    it("blocks private 192.168.x.x range", () => {
      expect(isInternalHostname("192.168.0.1")).toBe(true);
      expect(isInternalHostname("192.168.255.255")).toBe(true);
    });

    it("blocks cloud metadata IP (169.254.x.x)", () => {
      expect(isInternalHostname("169.254.169.254")).toBe(true);
    });

    it("blocks 0.0.0.0", () => {
      expect(isInternalHostname("0.0.0.0")).toBe(true);
    });

    it("blocks .local TLD", () => {
      expect(isInternalHostname("service.local")).toBe(true);
      expect(isInternalHostname("myapp.LOCAL")).toBe(true);
    });

    it("blocks .internal TLD", () => {
      expect(isInternalHostname("api.internal")).toBe(true);
    });

    it("blocks .localhost TLD", () => {
      expect(isInternalHostname("app.localhost")).toBe(true);
    });
  });

  describe("allows public hostnames", () => {
    it("allows public domains", () => {
      expect(isInternalHostname("example.com")).toBe(false);
      expect(isInternalHostname("api.github.com")).toBe(false);
    });

    it("allows public IPs", () => {
      expect(isInternalHostname("8.8.8.8")).toBe(false);
      expect(isInternalHostname("1.1.1.1")).toBe(false);
    });

    it("allows 172.x.x.x outside private range", () => {
      expect(isInternalHostname("172.15.0.1")).toBe(false);
      expect(isInternalHostname("172.32.0.1")).toBe(false);
    });
  });
});

describe("validateMonitorUrl", () => {
  describe("basic validation", () => {
    it("returns error for empty URL", () => {
      expect(validateMonitorUrl("")).toBe("URL is required");
    });

    it("returns error for invalid protocol", () => {
      expect(validateMonitorUrl("ftp://example.com")).toBe(
        "URL must start with http:// or https://",
      );
      expect(validateMonitorUrl("example.com")).toBe(
        "URL must start with http:// or https://",
      );
    });

    it("returns error for malformed URL", () => {
      // URL that passes regex but fails URL constructor
      expect(validateMonitorUrl("http://[invalid")).toBe("Invalid URL format");
    });

    it("returns null for valid HTTP URL", () => {
      expect(validateMonitorUrl("http://example.com")).toBeNull();
    });

    it("returns null for valid HTTPS URL", () => {
      expect(validateMonitorUrl("https://example.com")).toBeNull();
      expect(validateMonitorUrl("https://api.example.com/health")).toBeNull();
    });
  });

  describe("SSRF protection", () => {
    it("blocks localhost URLs", () => {
      expect(validateMonitorUrl("http://localhost")).toBe(
        "URL cannot target internal networks",
      );
      expect(validateMonitorUrl("http://localhost:3000")).toBe(
        "URL cannot target internal networks",
      );
    });

    it("blocks loopback IPs", () => {
      expect(validateMonitorUrl("http://127.0.0.1")).toBe(
        "URL cannot target internal networks",
      );
      expect(validateMonitorUrl("http://127.0.0.1:8080")).toBe(
        "URL cannot target internal networks",
      );
    });

    it("blocks private network IPs", () => {
      expect(validateMonitorUrl("http://10.0.0.1")).toBe(
        "URL cannot target internal networks",
      );
      expect(validateMonitorUrl("http://172.16.0.1")).toBe(
        "URL cannot target internal networks",
      );
      expect(validateMonitorUrl("http://192.168.1.1")).toBe(
        "URL cannot target internal networks",
      );
    });

    it("blocks cloud metadata IP", () => {
      expect(validateMonitorUrl("http://169.254.169.254")).toBe(
        "URL cannot target internal networks",
      );
      expect(
        validateMonitorUrl("http://169.254.169.254/latest/meta-data/"),
      ).toBe("URL cannot target internal networks");
    });

    it("blocks internal TLDs", () => {
      expect(validateMonitorUrl("http://service.local")).toBe(
        "URL cannot target internal networks",
      );
      expect(validateMonitorUrl("http://api.internal")).toBe(
        "URL cannot target internal networks",
      );
    });

    it("allows valid public URLs", () => {
      expect(validateMonitorUrl("https://google.com")).toBeNull();
      expect(validateMonitorUrl("http://8.8.8.8")).toBeNull();
    });
  });
});
