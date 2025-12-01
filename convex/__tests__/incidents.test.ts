import { test, expect, describe } from 'vitest';
import { api, internal } from '../_generated/api';
import { setupBackend } from '../../tests/convex';

const user = { name: "Test", subject: "user_test", issuer: "clerk" };

// Helper to create a monitor and return its ID
async function createTestMonitor(
  t: ReturnType<typeof setupBackend>,
  projectSlug = 'test-project',
  name = 'Test Monitor'
) {
  return await t.withIdentity(user).mutation(api.monitors.create, {
    name,
    url: 'https://example.com',
    method: 'GET',
    interval: 60,
    timeout: 10000,
    projectSlug,
  });
}

describe('getForMonitor', () => {
  test('returns empty array for monitor with no incidents', async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(0);
  });

  test('returns incidents for monitor', async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create an incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(1);
    expect(incidents[0].status).toBe('investigating');
  });

  test('returns incidents in descending order', async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create and resolve first incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });

    // Create second incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(2);
    // Most recent (investigating) first
    expect(incidents[0].status).toBe('investigating');
    expect(incidents[1].status).toBe('resolved');
  });

  test('respects limit parameter', async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create multiple incidents
    for (let i = 0; i < 5; i++) {
      await t.mutation(internal.monitoring.openIncident, { monitorId });
      await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    }

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId, limit: 2 });
    expect(incidents).toHaveLength(2);
  });
});

describe('getForProject', () => {
  test('returns empty array for project with no monitors', async () => {
    const t = setupBackend();

    const incidents = await t.query(api.incidents.getForProject, { projectSlug: 'nonexistent' });
    expect(incidents).toHaveLength(0);
  });

  test('returns incidents across all monitors in project', async () => {
    const t = setupBackend();
    const projectSlug = 'multi-monitor-project';

    const monitor1 = await createTestMonitor(t, projectSlug, 'Monitor 1');
    const monitor2 = await createTestMonitor(t, projectSlug, 'Monitor 2');

    // Create incident for each monitor
    await t.mutation(internal.monitoring.openIncident, { monitorId: monitor1 });
    await t.mutation(internal.monitoring.openIncident, { monitorId: monitor2 });

    const incidents = await t.query(api.incidents.getForProject, { projectSlug });
    expect(incidents).toHaveLength(2);
  });

  test('filters by status when statusFilter provided', async () => {
    const t = setupBackend();
    const projectSlug = 'filter-project';
    const monitorId = await createTestMonitor(t, projectSlug);

    // Create one resolved and one open incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    // Filter for investigating only
    const investigating = await t.query(api.incidents.getForProject, {
      projectSlug,
      statusFilter: 'investigating',
    });
    expect(investigating).toHaveLength(1);
    expect(investigating[0].status).toBe('investigating');

    // Filter for resolved only
    const resolved = await t.query(api.incidents.getForProject, {
      projectSlug,
      statusFilter: 'resolved',
    });
    expect(resolved).toHaveLength(1);
    expect(resolved[0].status).toBe('resolved');
  });

  test('sorts incidents by startedAt descending', async () => {
    const t = setupBackend();
    const projectSlug = 'sorted-project';
    const monitorId = await createTestMonitor(t, projectSlug);

    // Create multiple incidents
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    const incidents = await t.query(api.incidents.getForProject, { projectSlug });
    expect(incidents).toHaveLength(3);

    // Verify descending order
    for (let i = 0; i < incidents.length - 1; i++) {
      expect(incidents[i].startedAt).toBeGreaterThanOrEqual(incidents[i + 1].startedAt);
    }
  });

  test('respects limit parameter', async () => {
    const t = setupBackend();
    const projectSlug = 'limited-project';
    const monitorId = await createTestMonitor(t, projectSlug);

    // Create multiple incidents
    for (let i = 0; i < 5; i++) {
      await t.mutation(internal.monitoring.openIncident, { monitorId });
      await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    }

    const incidents = await t.query(api.incidents.getForProject, { projectSlug, limit: 3 });
    expect(incidents).toHaveLength(3);
  });
});

describe('getOpenIncidents', () => {
  test('returns empty array when no open incidents', async () => {
    const t = setupBackend();

    const incidents = await t.query(api.incidents.getOpenIncidents, {});
    expect(incidents).toHaveLength(0);
  });

  test('returns only investigating incidents', async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create and resolve one incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });

    // Create one open incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    const incidents = await t.query(api.incidents.getOpenIncidents, {});
    expect(incidents).toHaveLength(1);
    expect(incidents[0].status).toBe('investigating');
  });

  test('returns open incidents across multiple monitors', async () => {
    const t = setupBackend();
    const monitor1 = await createTestMonitor(t, 'project-1', 'Monitor 1');
    const monitor2 = await createTestMonitor(t, 'project-2', 'Monitor 2');

    await t.mutation(internal.monitoring.openIncident, { monitorId: monitor1 });
    await t.mutation(internal.monitoring.openIncident, { monitorId: monitor2 });

    const incidents = await t.query(api.incidents.getOpenIncidents, {});
    expect(incidents).toHaveLength(2);
  });
});
