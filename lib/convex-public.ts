/**
 * Public Convex client for ISR-compatible server-side queries.
 *
 * Why this exists:
 * - `fetchQuery` from `convex/nextjs` calls `cookies()` internally for auth
 * - This triggers Next.js DYNAMIC_SERVER_USAGE error on ISR pages
 * - Public queries don't need auth, so we use ConvexHttpClient directly
 *
 * Use this for public status pages with `revalidate` config.
 * Use `fetchQuery` from `convex/nextjs` for authenticated server components.
 */
import { ConvexHttpClient } from "convex/browser";
import type {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
} from "convex/server";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL environment variable is required for public queries",
  );
}

// Module-level singleton - reused across all queries to avoid connection overhead
const client = new ConvexHttpClient(convexUrl);

/**
 * Fetch a public Convex query without triggering dynamic server usage.
 * Compatible with ISR (Incremental Static Regeneration).
 */
export async function fetchPublicQuery<
  Query extends FunctionReference<"query">,
>(query: Query, args: FunctionArgs<Query>): Promise<FunctionReturnType<Query>> {
  return client.query(query, args);
}
