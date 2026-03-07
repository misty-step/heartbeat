import { NextRequest, NextResponse } from "next/server";
import { TargetInputError } from "@/lib/domain";
import { getPublicIsItDownSnapshot } from "@/lib/public-is-it-down";

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target")?.trim();
  if (!target) {
    return NextResponse.json(
      { error: "Missing target query parameter" },
      { status: 400 },
    );
  }

  try {
    const { snapshot } = await getPublicIsItDownSnapshot(target);
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof TargetInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Probe failed" }, { status: 500 });
  }
}
