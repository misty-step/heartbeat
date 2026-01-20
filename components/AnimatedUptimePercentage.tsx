"use client";

import { useEffect, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/cn";

/**
 * AnimatedUptimePercentage - Kyoto Moss Design System
 *
 * Animated uptime percentage display with count-up on scroll.
 * Uses semantic status colors based on uptime threshold.
 */
interface AnimatedUptimePercentageProps {
  percentage: number;
  totalChecks: number;
  failedChecks: number;
  period?: string;
}

export function AnimatedUptimePercentage({
  percentage = 99.98,
  totalChecks = 43200,
  failedChecks = 14,
  period = "Last 30 Days",
}: AnimatedUptimePercentageProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.2);

  useEffect(() => {
    // Only animate when visible
    if (!isVisible) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayValue(percentage);
      return;
    }

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = percentage / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(percentage);
        clearInterval(interval);
      } else {
        setDisplayValue(increment * currentStep);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [percentage, isVisible]);

  // Map uptime percentage to semantic status color
  const getStatusColor = (pct: number) => {
    if (pct >= 99.0) return "text-up";
    if (pct >= 95.0) return "text-degraded";
    return "text-down";
  };

  return (
    <div ref={ref} className={cn("scroll-fade-in", isVisible && "visible")}>
      <p className="text-sm text-[var(--color-text-secondary)] font-mono uppercase tracking-wide">
        {period}
      </p>
      <p
        className={cn(
          "text-5xl lg:text-6xl font-display font-bold tabular-nums transition-colors duration-300",
          getStatusColor(displayValue),
        )}
      >
        {displayValue.toFixed(2)}%
      </p>
      <p className="text-sm text-[var(--color-text-tertiary)] font-mono">
        {failedChecks.toLocaleString()}{" "}
        {failedChecks === 1 ? "check" : "checks"} failed out of{" "}
        {totalChecks.toLocaleString()}
      </p>
    </div>
  );
}
