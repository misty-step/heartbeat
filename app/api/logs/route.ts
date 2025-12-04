import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod/v4";
import { logger } from "@/lib/logger/server";

// Rate limiter: 100 requests per minute per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
});

// Schema validation
const LogEntrySchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]),
  message: z.string().max(1000),
  timestamp: z.iso.datetime(),
  context: z.record(z.string(), z.unknown()).optional(),
  error: z
    .object({
      name: z.string().optional(),
      message: z.string().optional(),
      stack: z.string().optional(),
    })
    .optional(),
  url: z.url().optional(),
  userAgent: z.string().max(500).optional(),
});

const RequestSchema = z.object({
  entries: z.array(LogEntrySchema).max(50), // Max 50 entries per batch
});

// Allowed origins
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000", // Development
].filter(Boolean);

const MAX_PAYLOAD_SIZE = 10 * 1024; // 10KB

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Rate limit check
  const { success, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  // Origin check
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // Payload size check
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const body = await request.json();

    // Schema validation
    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.flatten() },
        { status: 400 },
      );
    }

    // Forward logs to server logger
    const requestId =
      request.headers.get("x-request-id") ?? crypto.randomUUID();
    const clientLoggerInstance = logger.child({
      source: "client",
      clientIp: ip,
      requestId,
    });

    for (const entry of result.data.entries) {
      const logMethod =
        entry.level === "error"
          ? "error"
          : entry.level === "warn"
            ? "warn"
            : "info";

      clientLoggerInstance[logMethod](
        {
          ...entry.context,
          clientUrl: entry.url,
          clientUserAgent: entry.userAgent,
          clientTimestamp: entry.timestamp,
          clientError: entry.error,
        },
        entry.message,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error, ip }, "Failed to process client logs");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
