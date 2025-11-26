"use client";

import { useState, useEffect, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

type FormErrors = Partial<Record<string, string>>;

const INITIAL_FORM_DATA = {
  url: "",
  name: "",
  projectSlug: "",
  checkInterval: 300000, // 5 minutes default
};

export function AddMonitorForm() {
  const createMonitor = useMutation(api.monitors.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const generateSlug = (text: string): string => {
    return text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/[\s-]+/g, "-") // Replace spaces/multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Trim hyphens from start/end
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.url) newErrors.url = "URL is required";
    else if (!/^https?:\/\/.+/.test(formData.url))
      newErrors.url = "URL must start with http:// or https://";

    if (!formData.name) newErrors.name = "Name is required";

    if (!formData.projectSlug) newErrors.projectSlug = "Project slug is required";
    else if (!/^[a-z0-9-]+$/.test(formData.projectSlug))
      newErrors.projectSlug = "Slug must be lowercase letters, numbers, and hyphens only";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createMonitor({
        name: formData.name,
        url: formData.url,
        projectSlug: formData.projectSlug,
        method: "GET",
        interval: formData.checkInterval,
        timeout: 30000,
      });

      // Show success message
      setShowSuccess(true);

      // Clear form
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    } catch (error) {
      console.error("Failed to create monitor:", error);
      setErrors({ url: "Failed to create monitor. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="px-4 py-3 rounded-lg bg-success/10 text-success text-sm font-medium">
          Monitor created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL field */}
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-medium text-text-primary">
            URL *
          </label>
          <input
            type="text"
            id="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://example.com"
            className={`w-full px-3 py-2 rounded-lg bg-surface border ${
              errors.url ? "border-error" : "border-border"
            } text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50`}
          />
          {errors.url && (
            <p className="text-sm text-error">{errors.url}</p>
          )}
        </div>

        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-text-primary">
            Monitor Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value;
              updateField("name", value);
              // Auto-generate slug from name if slug is empty
              if (!formData.projectSlug) {
                updateField("projectSlug", generateSlug(value));
              }
            }}
            placeholder="API Server"
            className={`w-full px-3 py-2 rounded-lg bg-surface border ${
              errors.name ? "border-error" : "border-border"
            } text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50`}
          />
          {errors.name && (
            <p className="text-sm text-error">{errors.name}</p>
          )}
        </div>

        {/* Project Slug field */}
        <div className="space-y-2">
          <label htmlFor="projectSlug" className="block text-sm font-medium text-text-primary">
            Project Slug *
          </label>
          <input
            type="text"
            id="projectSlug"
            value={formData.projectSlug}
            onChange={(e) => updateField("projectSlug", e.target.value)}
            placeholder="api-server"
            className={`w-full px-3 py-2 rounded-lg bg-surface border ${
              errors.projectSlug ? "border-error" : "border-border"
            } text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-success/50 font-mono text-sm`}
          />
          {errors.projectSlug && (
            <p className="text-sm text-error">{errors.projectSlug}</p>
          )}
          <p className="text-xs text-text-tertiary">
            Status page: <span className="font-mono">{formData.projectSlug || "your-slug"}.heartbeat.engineering</span>
          </p>
        </div>

        {/* Check Interval field */}
        <div className="space-y-2">
          <label htmlFor="checkInterval" className="block text-sm font-medium text-text-primary">
            Check Interval
          </label>
          <select
            id="checkInterval"
            value={formData.checkInterval}
            onChange={(e) => updateField("checkInterval", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-success/50"
          >
            <option value={60000}>Every 1 minute</option>
            <option value={300000}>Every 5 minutes</option>
          </select>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 rounded-lg bg-success text-white font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Creating..." : "Create Monitor"}
        </button>
      </form>
    </div>
  );
}
