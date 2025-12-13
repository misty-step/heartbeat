"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { validateUrl, generateSlug, extractNameFromUrl } from "@/lib/domain";
import { Check, Copy, ExternalLink } from "lucide-react";

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

  // generateSlug and extractNameFromUrl imported from @/lib/domain

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
        onSuccess?.();
      }
    } catch (err) {
      console.error("Failed to create monitor:", err);
      setError("Failed to create monitor. Please try again.");
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
          <p className="text-sm font-medium text-foreground/70">
            Monitor created! Share your status page:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-foreground/5 border border-foreground/10 text-foreground/80 font-mono text-sm truncate">
              {statusPageUrl}
            </code>
            <button
              type="button"
              onClick={copyToClipboard}
              className="p-3 border border-foreground/20 hover:bg-foreground/5 transition-colors"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-foreground/60" />
              )}
            </button>
            <a
              href={statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 border border-foreground/20 hover:bg-foreground/5 transition-colors"
              title="Open status page"
            >
              <ExternalLink className="h-4 w-4 text-foreground/60" />
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDone}
          className="w-full px-6 py-3 bg-foreground text-background font-medium transition-opacity hover:opacity-80"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* URL field - primary */}
      <div className="space-y-2">
        <label
          htmlFor="url"
          className="block text-sm font-medium text-foreground/70"
        >
          URL
        </label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/health"
          className="w-full px-4 py-3 bg-transparent border border-foreground/20 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/50 transition-colors"
          autoFocus
        />
      </div>

      {/* Name field - secondary */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground/70"
        >
          Name
          <span className="ml-2 text-foreground/40 font-normal">optional</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={url ? extractNameFromUrl(url) || "My API" : "My API"}
          className="w-full px-4 py-3 bg-transparent border border-foreground/20 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/50 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-foreground text-background font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Starting..." : "Start Monitoring"}
      </button>
    </form>
  );
}
