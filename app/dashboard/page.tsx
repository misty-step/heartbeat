"use client";

import { useState, useMemo } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DashboardMonitorCard } from "../../components/DashboardMonitorCard";
import { MonitorSettingsModal } from "../../components/MonitorSettingsModal";
import { AddMonitorForm } from "../../components/AddMonitorForm";
import { StatusIndicator } from "../../components/StatusIndicator";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Activity, Clock, X } from "lucide-react";
import {
  computeStatus,
  aggregateStatuses,
  formatRelativeTime,
  getStatusHeadline,
} from "@/lib/domain";

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const monitors = useQuery(api.monitors.list, isAuthenticated ? {} : "skip");
  const [editingMonitorId, setEditingMonitorId] =
    useState<Id<"monitors"> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const editingMonitor = monitors?.find((m) => m._id === editingMonitorId);

  // Calculate aggregate status using domain logic
  const aggregateStatus = useMemo(() => {
    if (!monitors || monitors.length === 0) return null;
    const statuses = monitors.map((m) => computeStatus(m.consecutiveFailures));
    return aggregateStatuses(statuses);
  }, [monitors]);

  // Get last check time
  const lastCheckTime = useMemo(() => {
    if (!monitors || monitors.length === 0) return null;
    const times = monitors
      .map((m) => m.lastCheckAt)
      .filter((t): t is number => t !== undefined);
    if (times.length === 0) return null;
    return Math.max(...times);
  }, [monitors]);

  // formatRelativeTime and getStatusHeadline imported from @/lib/domain

  // Loading state
  if (isLoading || monitors === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground/60 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-foreground/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Empty state - the hero moment
  if (monitors.length === 0) {
    return (
      <div className="flex-1 flex items-center px-6 sm:px-12 lg:px-24 py-16 sm:py-24">
        <div className="w-full max-w-xl">
          {/* Editorial headline */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-foreground mb-12">
            What are you
            <br />
            <span className="italic">monitoring?</span>
          </h1>

          {/* Inline form */}
          <AddMonitorForm />

          {/* Subtle helper text */}
          <p className="mt-8 text-sm text-foreground/40">
            Checks run every 5 minutes. We'll alert you if something goes down.
          </p>
        </div>
      </div>
    );
  }

  // Dashboard with monitors
  return (
    <div className="px-6 sm:px-12 lg:px-24 py-8 sm:py-12">
      <div className="space-y-12">
        {/* Status Summary Header - THE hero */}
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            {aggregateStatus && (
              <div className="flex-shrink-0">
                <StatusIndicator status={aggregateStatus} size="xl" cinematic />
              </div>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground leading-none">
              {getStatusHeadline(aggregateStatus)}
            </h1>
          </div>
          <div className="flex items-center gap-6 text-sm text-foreground/50">
            <span className="inline-flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              <span className="tabular-nums">{monitors.length}</span>{" "}
              {monitors.length === 1 ? "monitor" : "monitors"}
            </span>
            {lastCheckTime && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Checked {formatRelativeTime(lastCheckTime)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between border-t border-foreground/10 pt-8">
          <h2 className="font-serif text-xl text-foreground/70">Monitors</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-all ${
              showAddForm
                ? "text-foreground/60 hover:text-foreground"
                : "bg-foreground text-background hover:opacity-80"
            }`}
          >
            {showAddForm ? (
              <>
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Monitor</span>
              </>
            )}
          </button>
        </div>

        {/* Add monitor form (collapsible) */}
        {showAddForm && (
          <div className="max-w-md pb-6 border-b border-foreground/10 animate-in slide-in-from-top-2 duration-200">
            <AddMonitorForm onSuccess={() => setShowAddForm(false)} />
          </div>
        )}

        {/* Monitor grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {monitors.map((monitor, index) => (
            <div
              key={monitor._id}
              className={`animate-fade-in-up opacity-0 stagger-${Math.min(index + 1, 9)}`}
            >
              <DashboardMonitorCard
                monitor={monitor}
                onEdit={() => setEditingMonitorId(monitor._id)}
              />
            </div>
          ))}
        </div>

        {/* Settings modal */}
        {editingMonitor && (
          <MonitorSettingsModal
            monitor={editingMonitor}
            onClose={() => setEditingMonitorId(null)}
          />
        )}
      </div>
    </div>
  );
}
