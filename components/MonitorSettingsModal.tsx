"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { X } from "lucide-react";
import { validateMonitorForm, type ValidationErrors } from "@/lib/domain";

/**
 * MonitorSettingsModal - Kyoto Moss Design System
 *
 * Modal dialog for editing monitor settings.
 */

interface Monitor {
  _id: Id<"monitors">;
  name: string;
  url: string;
  interval: number;
  timeout: number;
  expectedStatusCode?: number;
  visibility?: "public" | "private";
}

interface MonitorSettingsModalProps {
  monitor: Monitor;
  onClose: () => void;
}

type IntervalValue = 60 | 120 | 300 | 600 | 1800 | 3600;

export function MonitorSettingsModal({
  monitor,
  onClose,
}: MonitorSettingsModalProps) {
  const updateMonitor = useMutation(api.monitors.update);
  const removeMonitor = useMutation(api.monitors.remove);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: monitor.name,
    url: monitor.url,
    interval: monitor.interval as IntervalValue,
    timeout: Math.floor(monitor.timeout / 1000),
    expectedStatusCode: monitor.expectedStatusCode?.toString() || "",
    visibility: monitor.visibility,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const result = validateMonitorForm({
      url: formData.url,
      name: formData.name,
      expectedStatusCode: formData.expectedStatusCode,
    });
    setErrors(result.errors);
    return result.valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await updateMonitor({
        id: monitor._id,
        name: formData.name,
        url: formData.url,
        interval: formData.interval,
        timeout: formData.timeout * 1000,
        expectedStatusCode: formData.expectedStatusCode
          ? parseInt(formData.expectedStatusCode)
          : undefined,
        visibility: formData.visibility,
      });

      onClose();
    } catch (error) {
      console.error("Failed to update monitor:", error);
      setErrors({ submit: "Failed to update monitor. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (
      !confirm(
        `Delete ${monitor.name}? This will permanently delete all check history. This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeMonitor({ id: monitor._id });
      onClose();
    } catch (error) {
      console.error("Failed to delete monitor:", error);
      setErrors({ submit: "Failed to delete monitor. Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg mx-4 bg-[var(--color-bg-primary)] shadow-[var(--shadow-lg)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="font-display text-xl text-[var(--color-text-primary)]">
            Monitor Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded-[var(--radius-sm)]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {/* General error message */}
          {errors.submit && (
            <div className="px-4 py-3 bg-down-muted text-down text-sm rounded-[var(--radius-sm)]">
              {errors.submit}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Monitor Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-3 bg-transparent border ${
                errors.name
                  ? "border-[var(--color-status-down)]"
                  : "border-[var(--color-border-default)]"
              } text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors rounded-[var(--radius-md)]`}
            />
            {errors.name && <p className="text-sm text-down">{errors.name}</p>}
          </div>

          {/* URL field */}
          <div className="space-y-2">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              URL *
            </label>
            <input
              type="text"
              id="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className={`w-full px-4 py-3 bg-transparent border ${
                errors.url
                  ? "border-[var(--color-status-down)]"
                  : "border-[var(--color-border-default)]"
              } text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors rounded-[var(--radius-md)]`}
            />
            {errors.url && <p className="text-sm text-down">{errors.url}</p>}
          </div>

          {/* Check Interval field */}
          <div className="space-y-2">
            <label
              htmlFor="interval"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Check Interval
            </label>
            <select
              id="interval"
              value={formData.interval}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interval: Number(e.target.value) as IntervalValue,
                })
              }
              className="w-full px-4 py-3 bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors rounded-[var(--radius-md)]"
            >
              <option value={60}>Every 1 minute</option>
              <option value={300}>Every 5 minutes</option>
              <option value={600}>Every 10 minutes</option>
              <option value={1800}>Every 30 minutes</option>
              <option value={3600}>Every hour</option>
            </select>
          </div>

          {/* Timeout field */}
          <div className="space-y-2">
            <label
              htmlFor="timeout"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Timeout (seconds)
            </label>
            <input
              type="number"
              id="timeout"
              min="5"
              max="60"
              value={formData.timeout}
              onChange={(e) =>
                setFormData({ ...formData, timeout: Number(e.target.value) })
              }
              className="w-full px-4 py-3 bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors rounded-[var(--radius-md)]"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              How long to wait for a response (5-60 seconds)
            </p>
          </div>

          {/* Expected Status Code field */}
          <div className="space-y-2">
            <label
              htmlFor="expectedStatusCode"
              className="block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Expected Status Code
              <span className="ml-2 text-[var(--color-text-muted)] font-normal">
                (optional)
              </span>
            </label>
            <input
              type="number"
              id="expectedStatusCode"
              min="100"
              max="599"
              value={formData.expectedStatusCode}
              onChange={(e) =>
                setFormData({ ...formData, expectedStatusCode: e.target.value })
              }
              placeholder="200"
              className={`w-full px-4 py-3 bg-transparent border ${
                errors.expectedStatusCode
                  ? "border-[var(--color-status-down)]"
                  : "border-[var(--color-border-default)]"
              } text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors rounded-[var(--radius-md)]`}
            />
            {errors.expectedStatusCode && (
              <p className="text-sm text-down">{errors.expectedStatusCode}</p>
            )}
            <p className="text-xs text-[var(--color-text-muted)]">
              Leave empty to accept any 2xx or 3xx status
            </p>
          </div>

          {/* Visibility toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Status Page Visibility
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visibility === "public"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visibility: e.target.checked ? "public" : "private",
                  })
                }
                className="size-4 accent-[var(--color-accent-primary)]"
              />
              <span className="text-sm text-[var(--color-text-primary)]">
                Show on public status page
              </span>
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">
              {formData.visibility === "public"
                ? "This monitor is visible on your public status page"
                : "This monitor is hidden from your public status page"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="px-4 py-2 text-down hover:bg-down-muted font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-sm)]"
            >
              {isDeleting ? "Deleting..." : "Delete Monitor"}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] font-medium transition-colors rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity rounded-[var(--radius-md)]"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
