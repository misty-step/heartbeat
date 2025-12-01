import { test, expect } from 'vitest';
import { api } from '../_generated/api';
import { setupBackend } from '../../tests/convex';

test('create monitor success', async () => {
  const t = setupBackend();
  
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

test('create monitor requires auth', async () => {
  const t = setupBackend();
  
  // Attempt without identity
  await expect(t.mutation(api.monitors.create, {
    name: 'Test Monitor',
    url: 'https://example.com',
    method: 'GET',
    interval: 60,
    timeout: 10,
    projectSlug: 'test-project',
  })).rejects.toThrow("Unauthorized");
});

test('create monitor input validation', async () => {
  const t = setupBackend();
  const user = { name: "Me", subject: "user_123", issuer: "clerk" };

  // Convex schema validation happens before handler, so t.mutation throws if arguments are invalid.
  // However, business logic validation (e.g. URL format if manually checked) happens in handler.
  // Currently schema enforces types.
  
  // If we had manual validation:
  // await expect(t.withIdentity(user).mutation(api.monitors.create, { ...invalid... })).rejects.toThrow();
  
  // Let's test valid minimal fields
  await t.withIdentity(user).mutation(api.monitors.create, {
    name: 'Valid Monitor',
    url: 'https://valid.com',
    method: 'POST',
    interval: 3600,
    timeout: 30,
    projectSlug: 'valid-project',
    // Optional fields omitted
  });
  
  const monitors = await t.withIdentity(user).query(api.monitors.list);
  expect(monitors).toHaveLength(1);
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