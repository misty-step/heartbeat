/**
 * UI Components - Field Design System
 *
 * CVA-based components with type-safe variants.
 * Warm matte surfaces, sage green accent, rounded-full pills.
 */

// Core primitives
export { Button, buttonVariants, type ButtonProps } from "./Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
} from "./Card";
export {
  StatusIndicator,
  StatusDot,
  statusIndicatorVariants,
  type StatusIndicatorProps,
} from "./StatusIndicator";

// Surface components
export { SurfacePanel } from "./SurfacePanel";
export { GlassPanel } from "./GlassPanel"; // @deprecated — use SurfacePanel
export { StatCard } from "./StatCard";
