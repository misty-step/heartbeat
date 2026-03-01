/**
 * Button - Field Design System
 *
 * CVA-based button with type-safe variants.
 * Primary: rounded-full pill with sage green accent.
 * Secondary: rounded-xl, softer.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  // Base styles - all buttons share these
  [
    "inline-flex items-center justify-center gap-2",
    "font-body font-medium",
    "transition-colors duration-normal ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        // Primary - Sage green, pill-shaped, the default action
        primary: [
          "bg-[var(--color-accent-primary)] text-white",
          "shadow-sm shadow-[var(--color-accent-primary)]/20",
          "hover:bg-[var(--color-accent-primary-hover)] hover:opacity-95",
          "focus-visible:outline-[var(--color-accent-primary)]",
        ],
        // Secondary - Outlined, warm border
        secondary: [
          "bg-transparent text-[var(--color-text-primary)]",
          "border border-[var(--color-border-default)]",
          "hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-strong)]",
          "focus-visible:outline-[var(--color-accent-primary)]",
        ],
        // Ghost - No background until hover
        ghost: [
          "bg-transparent text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]",
          "focus-visible:outline-[var(--color-accent-primary)]",
        ],
        // Danger - Red for destructive actions
        danger: [
          "bg-[var(--color-status-down)] text-white",
          "hover:opacity-90",
          "focus-visible:outline-[var(--color-status-down)]",
        ],
        // Link - Inline text link style
        link: [
          "bg-transparent text-[var(--color-accent-primary)] underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ],
      },
      size: {
        sm: "h-8 px-4 text-xs rounded-full",
        md: "h-10 px-5 text-sm rounded-full",
        lg: "h-12 px-8 text-base font-bold rounded-full",
        icon: "size-10 rounded-[var(--radius-md)]",
        "icon-sm": "size-8 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin size-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
