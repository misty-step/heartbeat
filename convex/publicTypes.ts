import { Doc, Id } from "./_generated/dataModel";
import { computeStatus } from "../lib/domain/status";

export type PublicMonitor = {
  _id: Id<"monitors">;
  name: string;
  status: "up" | "degraded" | "down";
  lastCheckAt?: number;
  lastResponseTime?: number;
  theme?:
    | "glass"
    | "ukiyo"
    | "memphis"
    | "blueprint"
    | "swiss"
    | "broadsheet"
    | "mission-control";
};

export type PublicCheck = {
  _id: Id<"checks">;
  status: "up" | "down";
  responseTime: number;
  checkedAt: number;
};

export type PublicIncident = {
  _id: Id<"incidents">;
  title: string;
  status: "investigating" | "identified" | "resolved";
  startedAt: number;
  resolvedAt?: number;
};

export function toPublicMonitor(monitor: Doc<"monitors">): PublicMonitor {
  return {
    _id: monitor._id,
    name: monitor.name,
    status: computeStatus(monitor.consecutiveFailures),
    lastCheckAt: monitor.lastCheckAt,
    lastResponseTime: monitor.lastResponseTime,
    theme: monitor.theme ?? "glass",
  };
}

export function toPublicCheck(check: Doc<"checks">): PublicCheck {
  return {
    _id: check._id,
    status: check.status === "up" ? "up" : "down",
    responseTime: check.responseTime,
    checkedAt: check.checkedAt,
  };
}

export function toPublicIncident(incident: Doc<"incidents">): PublicIncident {
  return {
    _id: incident._id,
    title: incident.title,
    status: incident.status,
    startedAt: incident.startedAt,
    resolvedAt: incident.resolvedAt,
  };
}
