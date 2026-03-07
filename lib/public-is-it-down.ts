import { api } from "@/convex/_generated/api";
import { fetchPublicQuery, runPublicAction } from "@/lib/convex-public";
import { normalizeTargetInput } from "@/lib/domain";

const PUBLIC_PROBE_CACHE_WINDOW_MS = 30 * 1000;

export async function getPublicIsItDownSnapshot(target: string) {
  const normalized = normalizeTargetInput(target);
  const latest = await fetchPublicQuery(api.isItDown.getLatestProbeForTarget, {
    target,
  });

  if (!latest || Date.now() - latest.checkedAt > PUBLIC_PROBE_CACHE_WINDOW_MS) {
    await runPublicAction(api.isItDown.probePublicTarget, {
      target,
    });
  }

  const snapshot = await fetchPublicQuery(api.isItDown.getStatusForTarget, {
    target,
  });

  return {
    hostname: normalized.hostname,
    snapshot,
  };
}
