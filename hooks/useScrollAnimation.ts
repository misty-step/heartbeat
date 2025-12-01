"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useScrollAnimation - Intersection Observer hook for scroll-triggered animations
 *
 * Triggers animation class when element enters viewport
 *
 * @param threshold - Visibility percentage to trigger (0.0 - 1.0), default 0.1
 * @param rootMargin - Margin around root, default "0px"
 * @returns ref to attach to element and isVisible state
 */
export function useScrollAnimation(
  threshold: number = 0.1,
  rootMargin: string = "0px"
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            // Once visible, stop observing (animation only triggers once)
            if (elementRef.current) {
              observer.unobserve(elementRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold, rootMargin, isVisible]);

  return { ref: elementRef, isVisible };
}
