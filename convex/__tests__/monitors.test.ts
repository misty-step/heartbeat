import { test, expect, describe } from 'vitest';
import { api } from '../_generated/api';
import { setupBackend } from '../../tests/convex';

const user = { name: "Test", subject: "user_123", issuer: "clerk" };
const otherUser = { name: "Other", subject: "user_456", issuer: "clerk" };

// Helper to create a monitor
async function createMonitor(
  t: ReturnType<typeof setupBackend>,
  identity = user,
  overrides = {}
) {
  return await t.withIdentity(identity).mutation(api.monitors.create, {
    name: 'Test Monitor',
    url: 'https://example.com',
    method: 'GET',
    interval: 60,
    timeout: 10000,
    projectSlug: 'test-project',
    ...overrides,
  });
}

describe('create', () => {
  test('creates monitor successfully', async () => {
    const t = setupBackend();
    
    await t.withIdentity(user).mutation(api.monitors.create, {
      name: 'Test Monitor',
      url: 'https://example.com',
      method: 'GET',
      interval: 60,
      timeout: 10,
      projectSlug: 'test-project',
    });

    const monitors = await t.withIdentity(user).query(api.monitors.list);
    expect(monitors).toHaveLength(1);
    expect(monitors[0]).toMatchObject({
      name: 'Test Monitor',
      url: 'https://example.com',
      interval: 60,
      projectSlug: 'test-project',
    });
  });

  test('requires auth', async () => {
    const t = setupBackend();
    
    await expect(t.mutation(api.monitors.create, {
      name: 'Test Monitor',
      url: 'https://example.com',
      method: 'GET',
      interval: 60,
      timeout: 10,
      projectSlug: 'test-project',
    })).rejects.toThrow("Unauthorized");
  });

  test('sets default fields correctly', async () => {
    const t = setupBackend();
    await createMonitor(t);

    const monitors = await t.withIdentity(user).query(api.monitors.list);
    expect(monitors[0].enabled).toBe(true);
    expect(monitors[0].consecutiveFailures).toBe(0);
    expect(monitors[0].createdAt).toBeDefined();
    expect(monitors[0].updatedAt).toBeDefined();
  });

  test('defaults visibility to public', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    const monitor = await t.withIdentity(user).query(api.monitors.get, { id: monitorId });
    expect(monitor.visibility).toBe("public");
  });

  test('can set visibility to private on create', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, user, { visibility: "private" });

    const monitor = await t.withIdentity(user).query(api.monitors.get, { id: monitorId });
    expect(monitor.visibility).toBe("private");
  });
});

describe('get', () => {
  test('returns monitor for owner', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    const monitor = await t.withIdentity(user).query(api.monitors.get, { id: monitorId });
    expect(monitor.name).toBe('Test Monitor');
    expect(monitor.url).toBe('https://example.com');
  });

  test('requires auth', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await expect(
      t.query(api.monitors.get, { id: monitorId })
    ).rejects.toThrow("Unauthorized");
  });

  test('throws for non-owner', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await expect(
      t.withIdentity(otherUser).query(api.monitors.get, { id: monitorId })
    ).rejects.toThrow("Monitor not found");
  });
});

describe('update', () => {
  test('updates monitor fields', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await t.withIdentity(user).mutation(api.monitors.update, {
      id: monitorId,
      name: 'Updated Name',
      interval: 300,
    });

    const monitor = await t.withIdentity(user).query(api.monitors.get, { id: monitorId });
    expect(monitor.name).toBe('Updated Name');
    expect(monitor.interval).toBe(300);
    expect(monitor.url).toBe('https://example.com'); // unchanged
  });

  test('requires auth', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await expect(
      t.mutation(api.monitors.update, { id: monitorId, name: 'New Name' })
    ).rejects.toThrow("Unauthorized");
  });

  test('throws for non-owner', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await expect(
      t.withIdentity(otherUser).mutation(api.monitors.update, { id: monitorId, name: 'New' })
    ).rejects.toThrow("Monitor not found");
  });

  test('can disable monitor', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await t.withIdentity(user).mutation(api.monitors.update, {
      id: monitorId,
      enabled: false,
    });

    const monitor = await t.withIdentity(user).query(api.monitors.get, { id: monitorId });
    expect(monitor.enabled).toBe(false);
  });

  test('can update visibility', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await t.withIdentity(user).mutation(api.monitors.update, {
      id: monitorId,
      visibility: "private",
    });

    const monitor = await t.withIdentity(user).query(api.monitors.get, { id: monitorId });
    expect(monitor.visibility).toBe("private");
  });
});

describe('remove', () => {
  test('deletes monitor', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await t.withIdentity(user).mutation(api.monitors.remove, { id: monitorId });

    const monitors = await t.withIdentity(user).query(api.monitors.list);
    expect(monitors).toHaveLength(0);
  });

  test('requires auth', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await expect(
      t.mutation(api.monitors.remove, { id: monitorId })
    ).rejects.toThrow("Unauthorized");
  });

  test('throws for non-owner', async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t);

    await expect(
      t.withIdentity(otherUser).mutation(api.monitors.remove, { id: monitorId })
    ).rejects.toThrow("Monitor not found");
  });
});

describe('getByProjectSlug', () => {
  test('returns only public monitors and redacts sensitive fields', async () => {
    const t = setupBackend();
    await createMonitor(t, user, { projectSlug: 'my-project' });
    await createMonitor(t, user, { projectSlug: 'my-project', name: 'Second', visibility: "private" });
    await createMonitor(t, user, { projectSlug: 'other-project' });

    const monitors = await t.query(api.monitors.getByProjectSlug, { projectSlug: 'my-project' });
    expect(monitors).toHaveLength(1);
    expect(monitors[0]).toMatchObject({ name: 'Test Monitor', status: 'up' });
    expect(monitors[0]).not.toHaveProperty('url');
    expect(monitors[0]).not.toHaveProperty('headers');
  });

  test('returns empty array for non-existent project', async () => {
    const t = setupBackend();

    const monitors = await t.query(api.monitors.getByProjectSlug, { projectSlug: 'nonexistent' });
    expect(monitors).toHaveLength(0);
  });
});

describe('list', () => {
  test('only returns user monitors', async () => {
    const t = setupBackend();
    
    await createMonitor(t, user, { name: 'My Monitor' });
    await createMonitor(t, otherUser, { name: 'Not My Monitor' });
    
    const monitors = await t.withIdentity(user).query(api.monitors.list);
    expect(monitors).toHaveLength(1);
    expect(monitors[0].name).toBe('My Monitor');
  });

  test('requires auth', async () => {
    const t = setupBackend();

    await expect(t.query(api.monitors.list)).rejects.toThrow("Unauthorized");
  });
});
