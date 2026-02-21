"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DeleteConfirmModalProps {
  monitorName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  monitorName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-sm mx-4 bg-[var(--color-bg-primary)] shadow-[var(--shadow-lg)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded-[var(--radius-sm)]"
          aria-label="Close"
          disabled={isDeleting}
        >
          <X className="size-4" />
        </button>

        <div className="px-6 py-6">
          <h2 className="font-display text-xl text-[var(--color-text-primary)] mb-3">
            Delete Monitor
          </h2>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
            <span className="font-medium text-[var(--color-text-primary)]">
              {monitorName}
            </span>{" "}
            will permanently delete all check history. This action cannot be
            undone.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-down hover:bg-down-muted font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-sm)]"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
