import { test, expect } from 'vitest';
import { api } from '../_generated/api';
import { setupBackend } from '../../tests/convex';

test('create monitor', async () => {
  const t = setupBackend();
  
  // Using withIdentity to set identity
  await t.withIdentity({ name: "Me", subject: "user_123", issuer: "clerk" }).mutation(api.monitors.create, {
    name: 'Test Monitor',
    url: 'https://example.com',
    method: 'GET',
    interval: 60,
    timeout: 10,
    projectSlug: 'test-project',
  });

  const monitors = await t.withIdentity({ name: "Me", subject: "user_123", issuer: "clerk" }).query(api.monitors.list);
  expect(monitors).toHaveLength(1);
  expect(monitors[0]).toMatchObject({
    name: 'Test Monitor',
    url: 'https://example.com',
    interval: 60,
    projectSlug: 'test-project',
  });
});

test('list monitors only returns user monitors', async () => {
  const t = setupBackend();
  
  // User A
  await t.withIdentity({ name: "A", subject: "user_A", issuer: "clerk" }).mutation(api.monitors.create, {
    name: 'My Monitor',
    url: 'https://my.com',
    method: 'GET',
    interval: 60,
    timeout: 10,
    projectSlug: 'my-project',
  });

  // User B
  await t.withIdentity({ name: "B", subject: "user_B", issuer: "clerk" }).mutation(api.monitors.create, {
    name: 'Not My Monitor',
    url: 'https://not-my.com',
    method: 'GET',
    interval: 60,
    timeout: 10,
    projectSlug: 'other-project',
  });
  
  const monitors = await t.withIdentity({ name: "A", subject: "user_A", issuer: "clerk" }).query(api.monitors.list);
  expect(monitors).toHaveLength(1);
  expect(monitors[0].name).toBe('My Monitor');
});
