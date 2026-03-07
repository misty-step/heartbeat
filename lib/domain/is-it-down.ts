export type IsItDownVerdict =
  | "likely_down_for_everyone"
  | "likely_local_issue"
  | "unclear_retrying"
  | "no_data";

export type ProbeSample = {
  status: "up" | "down";
  checkedAt: number;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
};

const RECENT_WINDOW_MS = 10 * 60 * 1000;

export class TargetInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TargetInputError";
  }
}

export function normalizeTargetInput(target: string): {
  hostname: string;
  probeUrl: string;
} {
  const trimmed = target.trim();
  if (!trimmed) {
    throw new TargetInputError("Target is required");
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(candidate);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TargetInputError("Only http and https targets are supported");
  }

  if (!url.hostname) {
    throw new TargetInputError("Target hostname is required");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const port = url.port ? `:${url.port}` : "";

  return {
    hostname,
    probeUrl: `${url.protocol}//${hostname}${port}`,
  };
}

export function computeIsItDownVerdict(args: {
  samples: ProbeSample[];
  openIncidentCount?: number;
  now?: number;
}): IsItDownVerdict {
  const now = args.now ?? Date.now();

  if ((args.openIncidentCount ?? 0) > 0) {
    return "likely_down_for_everyone";
  }

  if (args.samples.length === 0) {
    return "no_data";
  }

  const recentSamples = args.samples.filter(
    (sample) => sample.checkedAt >= now - RECENT_WINDOW_MS,
  );
  const considered = recentSamples.length > 0 ? recentSamples : args.samples;

  const upCount = considered.filter((sample) => sample.status === "up").length;
  const downCount = considered.length - upCount;

  if (downCount >= 2 && downCount > upCount) {
    return "likely_down_for_everyone";
  }

  if (upCount >= 2 && upCount >= downCount) {
    return "likely_local_issue";
  }

  return "unclear_retrying";
}

export function getIsItDownSummary(
  verdict: IsItDownVerdict,
  hostname: string,
): string {
  switch (verdict) {
    case "likely_down_for_everyone":
      return `${hostname} looks down for multiple checks`;
    case "likely_local_issue":
      return `${hostname} looks reachable from Heartbeat probes`;
    case "unclear_retrying":
      return `Signals are mixed for ${hostname}; retrying helps`;
    case "no_data":
      return `No probe data yet for ${hostname}`;
  }
}
