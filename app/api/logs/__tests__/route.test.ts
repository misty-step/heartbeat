import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Shared mock state
let mockLimitResult = {
  success: true,
  remaining: 99,
  reset: Date.now() + 60000,
};

vi.mock("@upstash/ratelimit", () => {
  class MockRatelimit {
    static slidingWindow = vi.fn().mockReturnValue({});
    async limit() {
      return mockLimitResult;
    }
  }
  return { Ratelimit: MockRatelimit };
});

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: vi.fn().mockReturnValue({}),
  },
}));

vi.mock("@/lib/logger/server", () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
    error: vi.fn(),
  },
}));

// Import after mocks
import { POST, GET } from "../route";

function createRequest(
  body: unknown,
  options: {
    origin?: string;
    contentLength?: string;
    ip?: string;
    requestId?: string;
  } = {},
) {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(options.origin && { origin: options.origin }),
    ...(options.contentLength && { "content-length": options.contentLength }),
    ...(options.ip && { "x-forwarded-for": options.ip }),
    ...(options.requestId && { "x-request-id": options.requestId }),
  });

  return new NextRequest("http://localhost:3000/api/logs", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function validLogEntry(overrides = {}) {
  return {
    level: "info",
    message: "test message",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("/api/logs route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limiter to success by default
    mockLimitResult = {
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful requests", () => {
    it("returns 200 for valid request with single entry", async () => {
      const request = createRequest({
        entries: [validLogEntry()],
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("returns 200 for valid request with multiple entries", async () => {
      const request = createRequest({
        entries: [
          validLogEntry({ message: "first" }),
          validLogEntry({ message: "second" }),
          validLogEntry({ message: "third" }),
        ],
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it("accepts all log levels", async () => {
      for (const level of ["debug", "info", "warn", "error"]) {
        const request = createRequest({
          entries: [validLogEntry({ level })],
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it("accepts entries with optional fields", async () => {
      const request = createRequest({
        entries: [
          validLogEntry({
            context: { key: "value" },
            url: "http://localhost:3000/page",
            userAgent: "Mozilla/5.0",
            error: { name: "Error", message: "test" },
          }),
        ],
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe("rate limiting", () => {
    it("returns 429 when rate limited", async () => {
      const resetTime = Date.now() + 30000;
      mockLimitResult = {
        success: false,
        remaining: 0,
        reset: resetTime,
      };

      const request = createRequest({
        entries: [validLogEntry()],
      });

      const response = await POST(request);
      expect(response.status).toBe(429);

      const body = await response.json();
      expect(body.error).toBe("Rate limit exceeded");
    });

    it("includes rate limit headers when rate limited", async () => {
      const resetTime = Date.now() + 30000;
      mockLimitResult = {
        success: false,
        remaining: 0,
        reset: resetTime,
      };

      const request = createRequest({
        entries: [validLogEntry()],
      });

      const response = await POST(request);

      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("X-RateLimit-Reset")).toBe(
        resetTime.toString(),
      );
      expect(response.headers.get("Retry-After")).toBeDefined();
    });
  });

  describe("origin validation", () => {
    it("returns 403 for invalid origin", async () => {
      const request = createRequest(
        { entries: [validLogEntry()] },
        { origin: "https://evil-site.com" },
      );

      const response = await POST(request);
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBe("Invalid origin");
    });

    it("accepts localhost origin", async () => {
      const request = createRequest(
        { entries: [validLogEntry()] },
        { origin: "http://localhost:3000" },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it("accepts requests without origin header", async () => {
      const request = createRequest({ entries: [validLogEntry()] });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe("payload size validation", () => {
    it("returns 413 for oversized payload", async () => {
      const request = createRequest(
        { entries: [validLogEntry()] },
        { contentLength: "20000" }, // 20KB > 10KB limit
      );

      const response = await POST(request);
      expect(response.status).toBe(413);

      const body = await response.json();
      expect(body.error).toBe("Payload too large");
    });

    it("accepts payload within size limit", async () => {
      const request = createRequest(
        { entries: [validLogEntry()] },
        { contentLength: "1000" }, // 1KB < 10KB limit
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe("schema validation", () => {
    it("returns 400 for missing entries", async () => {
      const request = createRequest({});

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Invalid request body");
    });

    it("returns 400 for invalid log level", async () => {
      const request = createRequest({
        entries: [validLogEntry({ level: "invalid" })],
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 400 for missing message", async () => {
      const request = createRequest({
        entries: [{ level: "info", timestamp: new Date().toISOString() }],
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid timestamp", async () => {
      const request = createRequest({
        entries: [validLogEntry({ timestamp: "not-a-date" })],
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 400 for too many entries", async () => {
      const entries = Array(51)
        .fill(null)
        .map(() => validLogEntry());
      const request = createRequest({ entries });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 400 for message exceeding max length", async () => {
      const request = createRequest({
        entries: [validLogEntry({ message: "x".repeat(1001) })],
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("HTTP methods", () => {
    it("returns 405 for GET request", async () => {
      const response = await GET();
      expect(response.status).toBe(405);

      const body = await response.json();
      expect(body.error).toBe("Method not allowed");
    });
  });
});
