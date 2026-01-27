import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version:
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
        "development",
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
