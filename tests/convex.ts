// tests/convex.ts
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { importMap } from "../convex/_generated/server";

// Factory for isolated test backend
export const setupBackend = () => convexTest(schema, import.meta.glob("../convex/**/*.ts"));

/**
 * Usage:
 * const t = setupBackend();
 * await t.mutation(api.monitors.create, { ... });
 * const result = await t.query(api.monitors.list);
 */
