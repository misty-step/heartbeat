import { describe, it, expect } from "vitest";
import { safeJsonLd } from "../json-ld";

describe("safeJsonLd", () => {
  it("serializes plain objects to JSON", () => {
    const result = safeJsonLd({ "@type": "Organization", name: "Heartbeat" });
    expect(JSON.parse(result)).toEqual({ "@type": "Organization", name: "Heartbeat" });
  });

  it("escapes < to prevent script tag injection", () => {
    const result = safeJsonLd({ name: "</script><script>alert('xss')</script>" });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c");
    expect(result).toContain("\\u003e");
  });

  it("escapes & to prevent entity injection", () => {
    const result = safeJsonLd({ name: "A & B" });
    expect(result).not.toContain("&");
    expect(result).toContain("\\u0026");
  });

  it("produces valid JSON after escaping", () => {
    const payload = { name: "</script>&<script>" };
    const result = safeJsonLd(payload);
    expect(JSON.parse(result)).toEqual(payload);
  });

  it("handles nested objects and arrays", () => {
    const payload = { items: [{ name: "<b>test</b>" }] };
    const result = safeJsonLd(payload);
    expect(result).not.toContain("<");
    expect(JSON.parse(result)).toEqual(payload);
  });
});
