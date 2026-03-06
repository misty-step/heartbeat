import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchPublicQuery, runPublicAction } from "@/lib/convex-public";
import { normalizeTargetInput } from "@/lib/domain";

const ON_DEMAND_CACHE_WINDOW_MS = 30 * 1000;

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target")?.trim();
  if (!target) {
    return NextResponse.json(
      { error: "Missing target query parameter" },
      { status: 400 },
    );
  }

  try {
    const { hostname } = normalizeTargetInput(target);
    const latest = await fetchPublicQuery(
      api.isItDown.getLatestProbeForTarget,
      {
        hostname,
      },
    );
    if (!latest || Date.now() - latest.checkedAt > ON_DEMAND_CACHE_WINDOW_MS) {
      await runPublicAction(api.isItDown.probePublicTarget, {
        target: hostname,
      });
    }

    const snapshot = await fetchPublicQuery(api.isItDown.getStatusForTarget, {
      target: hostname,
    });
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Probe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
