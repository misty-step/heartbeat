/**
 * Card - Field Design System
 *
 * CVA-based card with type-safe variants.
 * Default: white surface, rounded-xl, warm shadow.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { forwardRef, type HTMLAttributes } from "react";

const cardVariants = cva(
  // Base styles
  ["rounded-xl", "transition-all duration-normal ease-out"],
  {
    variants: {
      variant: {
        // Default - White card, warm shadow
        default: [
          "bg-[var(--color-bg-elevated)]",
          "border border-[var(--color-border-subtle)]",
          "shadow-[var(--shadow-sm)]",
        ],
        // Elevated - Stronger shadow
        elevated: [
          "bg-[var(--color-bg-elevated)]",
          "shadow-[var(--shadow-md)]",
        ],
        // Outlined - Transparent with visible border
        outlined: [
          "bg-transparent",
          "border border-[var(--color-border-default)]",
        ],
        // Filled - Secondary background
        filled: ["bg-[var(--color-bg-secondary)]", "border border-transparent"],
        // Ghost - No visible container
        ghost: ["bg-transparent border-transparent"],
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      interactive: {
        true: "card-hover cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      interactive: false,
    },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive, className }),
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

/**
 * CardHeader - Semantic header section
 */
export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

/**
 * CardTitle - Primary heading
 */
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-extrabold font-display text-[var(--color-text-primary)] text-balance",
      className,
    )}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

/**
 * CardDescription - Secondary text
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-[var(--color-text-secondary)] text-pretty",
      className,
    )}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

/**
 * CardContent - Main content area
 */
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));

CardContent.displayName = "CardContent";

/**
 * CardFooter - Action area
 */
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-3 pt-4", className)}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

export { cardVariants };
