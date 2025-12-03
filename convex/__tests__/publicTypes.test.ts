import { describe, expect, test } from 'vitest';
import { Doc, Id } from '../_generated/dataModel';
import {
  computeMonitorStatus,
  toPublicCheck,
  toPublicIncident,
  toPublicMonitor,
} from '../publicTypes';

const monitorId = "monitor_1" as Id<"monitors">;

const createMonitorDoc = (
  overrides: Partial<Doc<"monitors">> = {}
): Doc<"monitors"> => ({
  _id: monitorId,
  _creationTime: 0,
  name: "Prod API",
  url: "https://internal.example.com",
  method: "GET",
  interval: 60,
  timeout: 10000,
  expectedStatusCode: 200,
  expectedBodyContains: "ok",
  headers: [{ key: "Auth", value: "secret" }],
  body: '{"ping":true}',
  enabled: true,
  projectSlug: "project-slug",
  userId: "user_123",
  consecutiveFailures: 2,
  lastCheckAt: 170000,
  lastResponseTime: 250,
  createdAt: 1,
  updatedAt: 2,
  ...overrides,
});

const createCheckDoc = (
  overrides: Partial<Doc<"checks">> = {}
): Doc<"checks"> => ({
  _id: "check_1" as Id<"checks">,
  _creationTime: 0,
  monitorId,
  status: "degraded",
  statusCode: 500,
  responseTime: 320,
  errorMessage: "Timeout",
  checkedAt: 111,
  ...overrides,
});

const createIncidentDoc = (
  overrides: Partial<Doc<"incidents">> = {}
): Doc<"incidents"> => ({
  _id: "incident_1" as Id<"incidents">,
  _creationTime: 0,
  monitorId,
  status: "investigating",
  startedAt: 170000,
  resolvedAt: undefined,
  title: "API Down",
  description: "Internal stacktrace",
  notifiedAt: 170001,
  ...overrides,
});

describe('computeMonitorStatus', () => {
  test('uses thresholded failure levels', () => {
    expect(computeMonitorStatus(0)).toBe("up");
    expect(computeMonitorStatus(1)).toBe("degraded");
    expect(computeMonitorStatus(2)).toBe("degraded");
    expect(computeMonitorStatus(3)).toBe("down");
    expect(computeMonitorStatus(10)).toBe("down");
  });
});

describe('toPublicMonitor', () => {
  test('projects only safe monitor fields', () => {
    const monitor = createMonitorDoc();

    const result = toPublicMonitor(monitor);

    expect(result).toEqual({
      _id: monitor._id,
      name: monitor.name,
      status: "degraded",
      lastCheckAt: monitor.lastCheckAt,
      lastResponseTime: monitor.lastResponseTime,
    });

    expect(result).not.toHaveProperty("url");
    expect(result).not.toHaveProperty("headers");
    expect(result).not.toHaveProperty("body");
    expect(result).not.toHaveProperty("method");
    expect(result).not.toHaveProperty("userId");
    expect(result).not.toHaveProperty("timeout");
    expect(result).not.toHaveProperty("expectedStatusCode");
    expect(result).not.toHaveProperty("expectedBodyContains");
    expect(result).not.toHaveProperty("projectSlug");
    expect(result).not.toHaveProperty("enabled");
    expect(result).not.toHaveProperty("interval");
  });
});

describe('toPublicCheck', () => {
  test('collapses status and removes sensitive fields', () => {
    const check = createCheckDoc();

    const result = toPublicCheck(check);

    expect(result).toEqual({
      _id: check._id,
      status: "down",
      responseTime: check.responseTime,
      checkedAt: check.checkedAt,
    });
    expect(result).not.toHaveProperty("statusCode");
    expect(result).not.toHaveProperty("errorMessage");
    expect(result).not.toHaveProperty("monitorId");
  });
});

describe('toPublicIncident', () => {
  test('removes incident fields not safe for public', () => {
    const incident = createIncidentDoc();

    const result = toPublicIncident(incident);

    expect(result).toEqual({
      _id: incident._id,
      title: incident.title,
      status: incident.status,
      startedAt: incident.startedAt,
      resolvedAt: incident.resolvedAt,
    });
    expect(result).not.toHaveProperty("description");
    expect(result).not.toHaveProperty("monitorId");
    expect(result).not.toHaveProperty("notifiedAt");
  });
});
