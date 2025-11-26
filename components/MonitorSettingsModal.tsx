"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { X } from "lucide-react";

interface Monitor {
  _id: Id<"monitors">;
  name: string;
  url: string;
  interval: number;
  timeout: number;
  expectedStatusCode?: number;
}

interface MonitorSettingsModalProps {
  monitor: Monitor;
  onClose: () => void;
}

type FormErrors = Partial<Record<string, string>>;

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
    interval: monitor.interval,
    timeout: Math.floor(monitor.timeout / 1000), // Store in seconds
    expectedStatusCode: monitor.expectedStatusCode?.toString() || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.url) newErrors.url = "URL is required";
    else if (!/^https?:\/\/.+/.test(formData.url))
      newErrors.url = "URL must start with http:// or https://";

    if (!formData.name) newErrors.name = "Name is required";

    if (
      formData.expectedStatusCode &&
      (Number(formData.expectedStatusCode) < 100 ||
        Number(formData.expectedStatusCode) > 599)
    ) {
      newErrors.expectedStatusCode = "Must be 100-599";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        timeout: formData.timeout * 1000, // Convert seconds to milliseconds
        expectedStatusCode: formData.expectedStatusCode
          ? parseInt(formData.expectedStatusCode)
          : undefined,
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
        `Delete ${monitor.name}? This will permanently delete all check history. This action cannot be undone.`
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

  // Close modal on backdrop click
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
      <div className="relative w-full max-w-lg mx-4 bg-surface rounded-lg shadow-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Monitor Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* General error message */}
          {errors.submit && (
            <div className="px-4 py-3 rounded-lg bg-error/10 text-error text-sm font-medium">
              {errors.submit}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-text-primary"
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
              className={`w-full px-3 py-2 rounded-lg bg-background border ${
                errors.name ? "border-error" : "border-border"
              } text-text-primary focus:outline-none focus:ring-2 focus:ring-success/50`}
            />
            {errors.name && <p className="text-sm text-error">{errors.name}</p>}
          </div>

          {/* URL field */}
          <div className="space-y-2">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-text-primary"
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
              className={`w-full px-3 py-2 rounded-lg bg-background border ${
                errors.url ? "border-error" : "border-border"
              } text-text-primary focus:outline-none focus:ring-2 focus:ring-success/50`}
            />
            {errors.url && <p className="text-sm text-error">{errors.url}</p>}
          </div>

          {/* Check Interval field */}
          <div className="space-y-2">
            <label
              htmlFor="interval"
              className="block text-sm font-medium text-text-primary"
            >
              Check Interval
            </label>
            <select
              id="interval"
              value={formData.interval}
              onChange={(e) =>
                setFormData({ ...formData, interval: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-success/50"
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
              className="block text-sm font-medium text-text-primary"
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
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-success/50"
            />
            <p className="text-xs text-text-tertiary">
              How long to wait for a response (5-60 seconds)
            </p>
          </div>

          {/* Expected Status Code field */}
          <div className="space-y-2">
            <label
              htmlFor="expectedStatusCode"
              className="block text-sm font-medium text-text-primary"
            >
              Expected Status Code
              <span className="ml-2 text-xs text-text-tertiary font-normal">
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
              className={`w-full px-3 py-2 rounded-lg bg-background border ${
                errors.expectedStatusCode ? "border-error" : "border-border"
              } text-text-primary focus:outline-none focus:ring-2 focus:ring-success/50`}
            />
            {errors.expectedStatusCode && (
              <p className="text-sm text-error">{errors.expectedStatusCode}</p>
            )}
            <p className="text-xs text-text-tertiary">
              Leave empty to accept any 2xx or 3xx status
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-error hover:bg-error/10 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete Monitor"}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
