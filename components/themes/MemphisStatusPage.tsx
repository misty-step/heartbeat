"use client";

import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/domain/formatting";
import { type StatusPageThemeProps } from "./types";

const statusStyles = {
  up: {
    label: "UP",
    text: "text-[#4ade80]",
    dot: "bg-[#4ade80]",
    accent: "bg-[#4ade80]",
  },
  degraded: {
    label: "DEGRADED",
    text: "text-[#ffd93d]",
    dot: "bg-[#ffd93d]",
    accent: "bg-[#ffd93d]",
  },
  down: {
    label: "DOWN",
    text: "text-[#ff6b9d]",
    dot: "bg-[#ff6b9d]",
    accent: "bg-[#ff6b9d]",
  },
};

const barColors = [
  "bg-[#ff6b9d]",
  "bg-[#00d4ff]",
  "bg-[#ffd93d]",
  "bg-[#a855f7]",
];

export function MemphisStatusPage({
  monitorName,
  status,
  uptimePercentage,
  avgResponseTime,
  lastCheckAt,
  chartData,
  incidents,
}: StatusPageThemeProps) {
  const last30Days = chartData.slice(-30);
  const statusText =
    status === "up" ? "UP" : status === "degraded" ? "DEGRADED" : "DOWN";
  const statusConfig = statusStyles[status];
  const maxResponse = Math.max(
    ...last30Days.map((item) => item.responseTime),
    1,
  );

  const services = [
    {
      label: monitorName,
      status: statusText,
      color: statusConfig.text,
      dot: statusConfig.dot,
    },
    {
      label: "Uptime (30d)",
      status: `${uptimePercentage.toFixed(2)}%`,
      color: "text-[#a855f7]",
      dot: "bg-[#00d4ff]",
    },
    {
      label: "Avg Response",
      status: `${Math.round(avgResponseTime)}ms`,
      color: "text-[#00d4ff]",
      dot: "bg-[#ffd93d]",
    },
    {
      label: "Incidents",
      status: incidents.length === 0 ? "NONE" : `${incidents.length} ACTIVE`,
      color: incidents.length === 0 ? "text-[#4ade80]" : "text-[#ff6b9d]",
      dot: incidents.length === 0 ? "bg-[#4ade80]" : "bg-[#ff6b9d]",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffbf0] font-['Nunito'] text-[#1a1a2e]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Zilla+Slab:wght@400;500;600;700&display=swap");
        @keyframes memphis-float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(6deg);
          }
        }
      `}</style>

      {/* Floating background shapes */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        aria-hidden="true"
      >
        <div className="absolute left-[5%] top-[10%] size-10 rounded-full bg-[#ff6b9d] shadow-[4px_4px_0_#1a1a2e] animate-[memphis-float_10s_ease-in-out_infinite]" />
        <div className="absolute right-[8%] top-[18%] h-14 w-14 rotate-[18deg] bg-[#00d4ff] shadow-[4px_4px_0_#1a1a2e] animate-[memphis-float_12s_ease-in-out_infinite]" />
        <div className="absolute left-[3%] top-[58%] h-0 w-0 border-l-[30px] border-r-[30px] border-b-[50px] border-l-transparent border-r-transparent border-b-[#ffd93d] shadow-[4px_4px_0_#1a1a2e] animate-[memphis-float_9s_ease-in-out_infinite]" />
        <div className="absolute bottom-[22%] right-[5%] h-5 w-20 rotate-[-18deg] rounded-full bg-[#a855f7] shadow-[4px_4px_0_#1a1a2e] animate-[memphis-float_11s_ease-in-out_infinite]" />
        <div className="absolute bottom-[30%] left-[8%] size-9 rounded-full bg-[#4ade80] shadow-[4px_4px_0_#1a1a2e] animate-[memphis-float_8s_ease-in-out_infinite]" />
        <div className="absolute left-[2%] top-[38%] h-12 w-12 rotate-[-12deg] bg-[#fb923c] shadow-[4px_4px_0_#1a1a2e] animate-[memphis-float_13s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 lg:px-12">
        <header className="relative mb-12 text-center">
          <div className="pointer-events-none absolute left-1/2 top-[-24px] flex -translate-x-1/2 gap-3">
            <div className="h-7 w-7 rotate-[20deg] bg-[#ff6b9d] shadow-[2px_2px_0_#1a1a2e] animate-[spin_12s_linear_infinite]" />
            <div className="h-7 w-7 rounded-full bg-[#00d4ff] shadow-[2px_2px_0_#1a1a2e]" />
            <div className="h-7 w-7 rotate-[-15deg] bg-[#ffd93d] shadow-[2px_2px_0_#1a1a2e] animate-[spin_10s_linear_infinite]" />
            <div className="h-7 w-7 rounded-[0_999px_999px_999px] bg-[#a855f7] shadow-[2px_2px_0_#1a1a2e]" />
            <div className="h-7 w-7 rotate-[30deg] bg-[#4ade80] shadow-[2px_2px_0_#1a1a2e] animate-[spin_14s_linear_infinite]" />
          </div>
          <h1
            className="relative inline-block font-['Fredoka'] text-[clamp(3rem,8vw,5.5rem)] font-bold text-[#1a1a2e]"
            style={{
              textShadow: "4px 4px 0 #00d4ff, 8px 8px 0 #ff6b9d",
            }}
          >
            {monitorName}
            <span className="pointer-events-none absolute -bottom-2 left-[10%] right-[10%] h-2 bg-[repeating-linear-gradient(90deg,#ffd93d_0px,#ffd93d_15px,#a855f7_15px,#a855f7_30px)]" />
          </h1>
          <p className="mt-6 font-['Zilla_Slab'] text-lg font-semibold text-[#a855f7]">
            Status Monitor —{" "}
            {status === "up"
              ? "All Systems Groovy!"
              : status === "degraded"
                ? "Some Wiggles Detected!"
                : "Systems in Time-out!"}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Status",
              value: statusText,
              icon: "✓",
              valueColor: statusConfig.text,
              accent: "bg-[#ff6b9d]",
              iconBg: statusConfig.accent,
            },
            {
              label: "Uptime",
              value: `${uptimePercentage.toFixed(2)}%`,
              icon: "%",
              valueColor: "text-[#a855f7]",
              accent: "bg-[#00d4ff]",
              iconBg: "bg-[#00d4ff]",
            },
            {
              label: "Response",
              value: `${Math.round(avgResponseTime)}ms`,
              icon: "⚡",
              valueColor: "text-[#fb923c]",
              accent: "bg-[#ffd93d]",
              iconBg: "bg-[#ffd93d]",
            },
            {
              label: "Incidents",
              value: `${incidents.length}`,
              icon: "!",
              valueColor: "text-[#ff6b9d]",
              accent: "bg-[#a855f7]",
              iconBg: "bg-[#ff6b9d]",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={cn(
                "relative bg-white p-6",
                "border-[4px] border-[#1a1a2e]",
                "shadow-[8px_8px_0_#1a1a2e]",
                "transition-all duration-200",
                "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_#1a1a2e]",
              )}
            >
              <div
                className={cn(
                  "absolute -top-3 right-6 size-10 border-[4px] border-[#1a1a2e] rotate-[15deg]",
                  card.accent,
                )}
              />
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-[3px] border-[#1a1a2e] text-lg",
                    card.iconBg,
                  )}
                >
                  {card.icon}
                </div>
                <span className="font-['Zilla_Slab'] text-xs font-extrabold uppercase tracking-[0.2em]">
                  {card.label}
                </span>
              </div>
              <div
                className={cn(
                  "font-['Fredoka'] text-4xl font-bold leading-none",
                  card.valueColor,
                )}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <section className="relative mt-12 bg-white p-8 border-[4px] border-[#1a1a2e] shadow-[8px_8px_0_#a855f7]">
          <div className="pointer-events-none absolute inset-3 -z-10 border-[2px] border-dashed border-[#ffd93d]" />
          <div className="mb-6 flex items-center gap-4">
            <span className="h-2 w-12 border-[2px] border-[#1a1a2e] bg-[#00d4ff]" />
            <h2 className="font-['Fredoka'] text-2xl font-bold">
              Service Check
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.label}
                className="flex items-center gap-3 border-[3px] border-[#1a1a2e] bg-[#fffbf0] p-4"
              >
                <span
                  className={cn(
                    "size-4 rounded-full border-[2px] border-[#1a1a2e] animate-bounce motion-reduce:animate-none",
                    service.dot,
                  )}
                />
                <span className="text-sm font-bold">{service.label}</span>
                <span
                  className={cn(
                    "ml-auto font-['Zilla_Slab'] text-sm font-bold",
                    service.color,
                  )}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-2 w-12 border-[2px] border-[#1a1a2e] bg-[#00d4ff]" />
            <h2 className="font-['Fredoka'] text-2xl font-bold">
              30-Day History
            </h2>
          </div>
          <div className="grid h-28 grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-2 items-end gap-[3px] border-[4px] border-[#1a1a2e] bg-white p-4 shadow-[6px_6px_0_#00d4ff] sm:grid-cols-[repeat(30,minmax(0,1fr))] sm:grid-rows-1">
            {last30Days.length === 0 && (
              <div className="col-span-full flex items-center justify-center text-sm font-semibold text-[#a855f7]">
                No history yet
              </div>
            )}
            {last30Days.map((point, index) => {
              const height = Math.max(
                20,
                Math.min(
                  100,
                  Math.round((point.responseTime / maxResponse) * 100),
                ),
              );
              return (
                <div
                  key={`${point.timestamp}-${index}`}
                  className={cn(
                    "relative w-full border-[2px] border-[#1a1a2e]",
                    barColors[index % barColors.length],
                  )}
                  style={{ height: `${height}%` }}
                  title={`${Math.round(point.responseTime)}ms · ${point.status}`}
                />
              );
            })}
          </div>
        </section>

        <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-[4px] border-[#1a1a2e] bg-[#1a1a2e] px-6 py-4 text-white shadow-[8px_8px_0_#ff6b9d] sm:flex-row">
          <span className="font-['Fredoka'] text-lg font-bold">
            ♥ Heartbeat
          </span>
          <span className="font-['Zilla_Slab'] text-sm font-semibold">
            Last checked {lastCheckAt ? formatRelativeTime(lastCheckAt) : "—"}
          </span>
        </footer>
      </div>
    </div>
  );
}
