import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Heartbeat — Uptime monitoring that simply works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Satori requires TTF/OTF — not woff2. CSS v1 API with a bare Mozilla/4.0 UA
  // returns TTF with format('truetype'). CSS v2 + MSIE UA returns EOT. CSS v2
  // with no UA returns woff2. v1 + bare UA is the reliable path.
  const fontCss = await fetch(
    "https://fonts.googleapis.com/css?family=Plus+Jakarta+Sans:700,800",
    {
      headers: {
        "User-Agent": "Mozilla/4.0",
      },
    },
  ).then((res) => res.text());

  const fontUrl = fontCss.match(/src:\s*url\(([^)]+\.ttf[^)]*)\)/)?.[1];
  const fontBytes = fontUrl
    ? await fetch(fontUrl).then((res) => res.arrayBuffer())
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(145deg, #1a1a17 0%, #2a2a24 50%, #1a1a17 100%)",
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Sage green accent glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,74,62,0.4) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#2d4a3e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#22c55e",
                display: "flex",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "-0.02em",
            }}
          >
            heartbeat
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#f5f2eb",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: 800,
            display: "flex",
          }}
        >
          Uptime monitoring that simply works
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "rgba(245,242,235,0.5)",
            marginTop: 24,
            display: "flex",
          }}
        >
          Beautiful status pages and real-time alerts
        </div>

        {/* Uptime bar visualization */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 48,
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 32,
                borderRadius: 4,
                background:
                  i === 22
                    ? "#f59e0b"
                    : i === 23
                      ? "#ef4444"
                      : "#22c55e",
                opacity: 0.6 + (i / 30) * 0.4,
                display: "flex",
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontBytes
        ? [
            {
              name: "Plus Jakarta Sans",
              data: fontBytes,
              weight: 700,
              style: "normal" as const,
            },
          ]
        : [],
    },
  );
}
