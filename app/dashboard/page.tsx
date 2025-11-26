"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DashboardMonitorCard } from "../../components/DashboardMonitorCard";
import { MonitorSettingsModal } from "../../components/MonitorSettingsModal";
import { AddMonitorForm } from "../../components/AddMonitorForm";
import { Id } from "../../convex/_generated/dataModel";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const monitors = useQuery(api.monitors.list);
  const [editingMonitorId, setEditingMonitorId] = useState<Id<"monitors"> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const editingMonitor = monitors?.find((m) => m._id === editingMonitorId);

  // Loading state
  if (monitors === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Monitor your services in real-time
              </p>
            </div>

            {/* Loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-surface rounded-lg border border-border animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (monitors.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Monitor your services in real-time
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="text-center py-8 mb-8">
                <p className="text-base text-text-secondary mb-4">
                  No monitors yet. Create your first monitor to get started.
                </p>
              </div>
              <AddMonitorForm />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Monitor your services in real-time
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-text-primary text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Monitor</span>
            </button>
          </div>

          {/* Add monitor form */}
          {showAddForm && (
            <div className="max-w-2xl">
              <AddMonitorForm />
            </div>
          )}

          {/* Monitor grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitors.map((monitor) => (
              <DashboardMonitorCard
                key={monitor._id}
                monitor={monitor}
                onEdit={() => setEditingMonitorId(monitor._id)}
              />
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
    </div>
  );
}
