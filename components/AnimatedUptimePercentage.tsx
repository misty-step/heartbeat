"use client";

import { useEffect, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

/**
 * AnimatedUptimePercentage - Animated uptime percentage display
 *
 * Features:
 * - Count-up animation on scroll into view
 * - Precise to 2 decimal places
 * - Subtle glow for emphasis
 * - Context about checks
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

  const getStatusColor = (pct: number) => {
    if (pct >= 99.9) return "text-gradient-cyan";
    if (pct >= 99.0) return "text-success";
    if (pct >= 95.0) return "text-degraded";
    return "text-down";
  };

  const getGlowColor = (pct: number) => {
    if (pct >= 99.9) return "shadow-glow-cyan";
    return "";
  };

  return (
    <div ref={ref} className={`scroll-fade-in ${isVisible ? "visible" : ""}`}>
      <p className="text-sm text-text-secondary text-mono uppercase tracking-wide">
        {period}
      </p>
      <p
        className={`text-5xl lg:text-6xl text-display font-bold ${getStatusColor(displayValue)} ${getGlowColor(displayValue)} transition-all duration-300`}
      >
        {displayValue.toFixed(2)}%
      </p>
      <p className="text-sm text-text-tertiary text-mono">
        {failedChecks.toLocaleString()} {failedChecks === 1 ? "check" : "checks"} failed out of{" "}
        {totalChecks.toLocaleString()}
      </p>
    </div>
  );
}
