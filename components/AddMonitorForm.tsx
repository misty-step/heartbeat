"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { validateUrl, generateSlug, extractNameFromUrl } from "@/lib/domain";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * AddMonitorForm - Kyoto Moss Design System
 *
 * Form for creating new monitors with URL validation and success state.
 */
export function AddMonitorForm({ onSuccess }: { onSuccess?: () => void }) {
  const createMonitor = useMutation(api.monitors.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdStatusSlug, setCreatedStatusSlug] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation using domain function
    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }

    const monitorName = name || extractNameFromUrl(url);
    if (!monitorName) {
      setError("Please enter a name for this monitor");
      return;
    }

    setIsSubmitting(true);
    try {
      const monitor = await createMonitor({
        name: monitorName,
        url: url,
        projectSlug: generateSlug(monitorName),
        method: "GET",
        interval: 300, // 5 minutes, hardcoded
        timeout: 30000,
      });

      // Show success state with status page URL
      if (monitor?.statusSlug) {
        setCreatedStatusSlug(monitor.statusSlug);
      } else {
        // Fallback: reset and call onSuccess
        setUrl("");
        setName("");
        toast.success("Monitor created");
        onSuccess?.();
      }
    } catch (err) {
      console.error("Failed to create monitor:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create monitor. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusPageUrl = createdStatusSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/status/${createdStatusSlug}`
    : null;

  const copyToClipboard = async () => {
    if (!statusPageUrl) return;
    await navigator.clipboard.writeText(statusPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    setCreatedStatusSlug(null);
    setUrl("");
    setName("");
    setCopied(false);
    onSuccess?.();
  };

  // Success state - show status page URL
  if (createdStatusSlug && statusPageUrl) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Monitor created! Share your status page:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-mono text-sm truncate rounded-[var(--radius-sm)]">
              {statusPageUrl}
            </code>
            <button
              type="button"
              onClick={copyToClipboard}
              className="p-3 border border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded-[var(--radius-sm)]"
              title="Copy URL"
            >
              {copied ? (
                <Check className="size-4 text-up" />
              ) : (
                <Copy className="size-4 text-[var(--color-text-tertiary)]" />
              )}
            </button>
            <a
              href={statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 border border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)] transition-colors rounded-[var(--radius-sm)]"
              title="Open status page"
            >
              <ExternalLink className="size-4 text-[var(--color-text-tertiary)]" />
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDone}
          className="w-full px-6 py-3 bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] font-medium transition-opacity hover:opacity-80 rounded-[var(--radius-md)]"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-down">{error}</p>}

      {/* URL field - primary */}
      <div className="space-y-2">
        <label
          htmlFor="url"
          className="block text-sm font-medium text-[var(--color-text-secondary)]"
        >
          URL
        </label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/health"
          className="w-full px-4 py-3 bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors rounded-[var(--radius-md)]"
          autoFocus
        />
      </div>

      {/* Name field - secondary */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-[var(--color-text-secondary)]"
        >
          Name
          <span className="ml-2 text-[var(--color-text-muted)] font-normal">
            optional
          </span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={url ? extractNameFromUrl(url) || "My API" : "My API"}
          className="w-full px-4 py-3 bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors rounded-[var(--radius-md)]"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)]"
      >
        {isSubmitting ? "Starting..." : "Start Monitoring"}
      </button>
    </form>
  );
}
