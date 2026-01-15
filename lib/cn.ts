/**
 * Class name utility - combines clsx and tailwind-merge
 *
 * Use this for all className composition to ensure:
 * 1. Conditional classes work correctly
 * 2. Tailwind class conflicts are resolved properly
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-accent', className)
 * cn('text-sm', { 'font-bold': isBold, 'text-muted': isMuted })
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
