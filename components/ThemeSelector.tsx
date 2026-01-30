"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { THEMES, THEME_IDS, type ThemeId } from "@/lib/themes";

interface ThemeSelectorProps {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
  userTier: "pulse" | "vital";
}

function ColorSwatches({ colors }: { colors: readonly string[] }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {colors.map((color, i) => (
        <span
          key={i}
          className="size-3 rounded-full border border-[var(--color-border-subtle)]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function ThemeSelector({
  value,
  onChange,
  userTier,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedTheme = THEMES[value];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (themeId: ThemeId) => {
    onChange(themeId);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, themeId: ThemeId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(themeId);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3",
          "bg-transparent border rounded-[var(--radius-md)]",
          "text-[var(--color-text-primary)]",
          "transition-colors",
          isOpen
            ? "border-[var(--color-accent-primary)]"
            : "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <ColorSwatches colors={selectedTheme.colors} />
          <span className="text-sm font-medium">{selectedTheme.name}</span>
          {selectedTheme.minTier === "vital" && userTier === "pulse" && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--color-accent-secondary)] text-white rounded">
              Vital
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-[var(--color-text-muted)] transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full",
            "bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]",
            "rounded-[var(--radius-md)] shadow-[var(--shadow-lg)]",
            "max-h-[280px] overflow-y-auto",
          )}
          role="listbox"
          aria-label="Select theme"
        >
          {THEME_IDS.map((themeId) => {
            const theme = THEMES[themeId];
            const isSelected = value === themeId;
            const isPremium = theme.minTier === "vital";

            return (
              <div
                key={themeId}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handleSelect(themeId)}
                onKeyDown={(e) => handleKeyDown(e, themeId)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer",
                  "transition-colors",
                  isSelected
                    ? "bg-[var(--color-accent-primary)]/5"
                    : "hover:bg-[var(--color-bg-tertiary)]",
                )}
              >
                <ColorSwatches colors={theme.colors} />
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {theme.name}
                </span>
                {isPremium && userTier === "pulse" && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[var(--color-accent-secondary)] text-white rounded">
                    Vital
                  </span>
                )}
                {isSelected && (
                  <Check className="size-4 text-[var(--color-accent-primary)]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
