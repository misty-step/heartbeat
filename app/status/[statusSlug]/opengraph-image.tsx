import { ImageResponse } from "next/og";
import { fetchPublicQuery } from "@/lib/convex-public";
import { api } from "@/convex/_generated/api";
import { THEMES, DEFAULT_THEME, type ThemeId } from "@/lib/themes";

export const runtime = "edge";
export const alt = "Status Page — Heartbeat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_COLORS = {
  up: "#22c55e",
  degraded: "#f59e0b",
  down: "#ef4444",
} as const;

const STATUS_LABELS = {
  up: "Operational",
  degraded: "Degraded",
  down: "Down",
} as const;

export default async function Image({
  params,
}: {
  params: Promise<{ statusSlug: string }>;
}) {
  const { statusSlug } = await params;

  const monitor = await fetchPublicQuery(
    api.monitors.getPublicMonitorByStatusSlug,
    { statusSlug },
  );

  if (!monitor) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a17",
            color: "#f5f2eb",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          Status page not found
        </div>
      ),
      { ...size },
    );
  }

  // Fetch uptime stats
  const [uptimeResult] = await Promise.allSettled([
    fetchPublicQuery(api.checks.getPublicUptimeStats, {
      monitorId: monitor._id,
      days: 90,
    }),
  ]);

  const uptimeStats =
    uptimeResult.status === "fulfilled" ? uptimeResult.value : null;
  const uptimePercentage = uptimeStats?.uptimePercentage ?? null;

  // Theme colors
  const themeId = (monitor.theme as ThemeId) ?? DEFAULT_THEME;
  const theme = THEMES[themeId] ?? THEMES[DEFAULT_THEME];
  const [accent, statusUp, statusWarn, statusDown] = theme.colors;

  const status = monitor.status;
  const statusColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];

  // Determine bg based on theme
  const isDarkTheme = ["glass", "mission-control", "blueprint"].includes(
    themeId,
  );
  const bgColor = isDarkTheme ? "#1a1a17" : "#f5f2eb";
  const textColor = isDarkTheme ? "#f5f2eb" : "#1a1a17";
  const subtextColor = isDarkTheme
    ? "rgba(245,242,235,0.5)"
    : "rgba(26,26,23,0.5)";

  // Satori requires TTF/OTF — not woff2. CSS v1 API with a bare Mozilla/4.0 UA
  // returns TTF with format('truetype'). CSS v2 + MSIE UA returns EOT. CSS v2
  // with no UA returns woff2. v1 + bare UA is the reliable path.
  // Wrapped in try-catch: font failure degrades to system sans-serif, not a crash.
  const fontEntries: { name: string; data: ArrayBuffer; weight: 600 | 700 | 800; style: "normal" }[] = [];
  try {
    const fontCss = await fetch(
      "https://fonts.googleapis.com/css?family=Plus+Jakarta+Sans:600,700,800",
      { headers: { "User-Agent": "Mozilla/4.0" } },
    ).then((res) => res.text());

    // Extract all TTF URLs — CSS v1 returns one @font-face block per weight
    const ttfMatches = [...fontCss.matchAll(/font-weight:\s*(\d+)[^}]*src:\s*url\(([^)]+\.ttf[^)]*)\)/g)];
    await Promise.all(
      ttfMatches.map(async ([, weight, url]) => {
        const w = Number(weight);
        if (w !== 600 && w !== 700 && w !== 800) return;
        const data = await fetch(url).then((r) => r.arrayBuffer());
        fontEntries.push({ name: "Plus Jakarta Sans", data, weight: w as 600 | 700 | 800, style: "normal" });
      }),
    );
  } catch {
    // Font loading failed; ImageResponse falls back to system sans-serif
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: bgColor,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent glow from theme */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Top: brand + status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: statusColor,
                  display: "flex",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: subtextColor,
                letterSpacing: "-0.01em",
              }}
            >
              heartbeat
            </span>
          </div>

          {/* Status badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderRadius: 24,
              background: `${statusColor}18`,
              border: `1.5px solid ${statusColor}40`,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: statusColor,
                display: "flex",
              }}
            />
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Center: monitor name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: textColor,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              display: "flex",
              maxWidth: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {monitor.name}
          </div>

          {/* Uptime percentage */}
          {uptimePercentage !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: accent,
                  letterSpacing: "-0.02em",
                }}
              >
                {uptimePercentage.toFixed(2)}%
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: subtextColor,
                }}
              >
                uptime (90d)
              </span>
            </div>
          )}
        </div>

        {/* Bottom: uptime bar visualization */}
        <div
          style={{
            display: "flex",
            gap: 3,
            alignItems: "flex-end",
          }}
        >
          {Array.from({ length: 45 }).map((_, i) => {
            // Simulate an uptime bar; mostly green with theme accent
            const isCurrentStatus = i === 44;
            const barColor = isCurrentStatus
              ? statusColor
              : i % 15 === 7
                ? `${statusWarn}80`
                : `${statusUp}60`;
            return (
              <div
                key={i}
                style={{
                  width: 6,
                  height: isCurrentStatus ? 28 : 16 + (i % 5) * 3,
                  borderRadius: 3,
                  background: barColor,
                  display: "flex",
                }}
              />
            );
          })}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontEntries,
    },
  );
}
