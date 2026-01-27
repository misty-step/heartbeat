import { NextResponse } from "next/server";

/**
 * Health check endpoint for uptime monitoring and deployment verification.
 *
 * Returns:
 * - status: "ok" if healthy
 * - timestamp: ISO 8601 timestamp
 * - version: from NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA or "development"
 */
export async function GET() {
  const checks: Record<string, string> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      "development",
  };

  return NextResponse.json(checks, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
