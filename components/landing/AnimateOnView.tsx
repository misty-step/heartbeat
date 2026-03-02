"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Thin client island that wraps server-rendered children with
 * framer-motion whileInView reveal. Children are still SSR'd as HTML;
 * this component only adds the entrance animation on the client.
 */
export function AnimateOnView({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade-only variant (no y-translate), used for sections like TrustBar.
 */
export function FadeOnView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container that uses animate (not whileInView) for hero entrance.
 * Children should use AnimateOnView or motion.div with variants.
 */
export function StaggerReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={shouldReduceMotion ? "animate" : "initial"}
      animate="animate"
      variants={{
        animate: {
          transition: { staggerChildren: 0.1 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Child of StaggerReveal that uses variants for coordinated entrance.
 */
export function StaggerChild({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      variants={{
        initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated nav entrance (slides down from top).
 */
export function NavReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.nav
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.nav>
  );
}
