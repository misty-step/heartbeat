/**
 * Status slug generation for memorable monitor URLs.
 *
 * Pattern: "adjective-noun-verb" like "silver-mountain-echo"
 * ~125,000 combinations (50 × 50 × 50)
 */

import type { QueryCtx, MutationCtx } from "./_generated/server";

// Word lists curated for pleasant, memorable combinations
const ADJECTIVES = [
  "amber",
  "azure",
  "bright",
  "calm",
  "coral",
  "crisp",
  "dawn",
  "deep",
  "dusk",
  "fern",
  "frost",
  "gentle",
  "golden",
  "green",
  "ivory",
  "jade",
  "kind",
  "light",
  "lunar",
  "mild",
  "misty",
  "moss",
  "noble",
  "pale",
  "pearl",
  "pine",
  "pure",
  "quiet",
  "rose",
  "sage",
  "salt",
  "serene",
  "silver",
  "slate",
  "soft",
  "solar",
  "spring",
  "still",
  "stone",
  "storm",
  "summer",
  "swift",
  "teal",
  "true",
  "warm",
  "wild",
  "winter",
  "wise",
] as const;

const NOUNS = [
  "arch",
  "bay",
  "beam",
  "bell",
  "bird",
  "bloom",
  "brook",
  "cape",
  "cave",
  "cliff",
  "cloud",
  "cove",
  "creek",
  "crest",
  "dale",
  "dune",
  "echo",
  "edge",
  "field",
  "flame",
  "forge",
  "frost",
  "gate",
  "glen",
  "grove",
  "haven",
  "heath",
  "hill",
  "hollow",
  "lake",
  "leaf",
  "light",
  "marsh",
  "meadow",
  "mesa",
  "mist",
  "moon",
  "moss",
  "oak",
  "path",
  "peak",
  "pine",
  "pond",
  "ridge",
  "river",
  "rock",
  "sage",
  "sand",
  "shade",
  "shore",
  "sky",
  "spring",
  "star",
  "stone",
  "stream",
  "sun",
  "tide",
  "trail",
  "vale",
  "wave",
  "wind",
  "wood",
] as const;

const VERBS = [
  "bloom",
  "break",
  "burn",
  "call",
  "cast",
  "climb",
  "cross",
  "dance",
  "dawn",
  "drift",
  "echo",
  "fade",
  "fall",
  "flash",
  "float",
  "flow",
  "fly",
  "form",
  "glow",
  "grow",
  "hide",
  "hold",
  "hunt",
  "keep",
  "leap",
  "lift",
  "light",
  "meet",
  "melt",
  "move",
  "pass",
  "reach",
  "rest",
  "ride",
  "rise",
  "roam",
  "roll",
  "run",
  "seek",
  "shine",
  "sing",
  "sleep",
  "soar",
  "spark",
  "speak",
  "spin",
  "stand",
  "stay",
  "stir",
  "storm",
  "sweep",
  "swim",
  "swing",
  "turn",
  "wake",
  "walk",
  "watch",
  "wave",
  "weave",
  "wind",
] as const;

/**
 * Generate a random status slug.
 * Pure function — does not check for uniqueness.
 */
export function generateStatusSlug(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
  return `${adjective}-${noun}-${verb}`;
}

/**
 * Generate a random hex suffix for collision fallback.
 */
function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate a unique status slug by checking the database.
 * Retries up to maxAttempts times, then appends random suffix as fallback.
 */
export async function generateUniqueStatusSlug(
  ctx: QueryCtx | MutationCtx,
  maxAttempts = 10,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateStatusSlug();
    const existing = await ctx.db
      .query("monitors")
      .withIndex("by_status_slug", (q) => q.eq("statusSlug", slug))
      .first();

    if (!existing) {
      return slug;
    }
  }

  // Fallback: append random suffix to avoid infinite loops
  return `${generateStatusSlug()}-${randomHex(4)}`;
}

/**
 * Validate that a string matches the expected slug format.
 * Useful for tests and input validation.
 */
export function isValidStatusSlugFormat(slug: string): boolean {
  // Pattern: word-word-word (optionally with -xxxx suffix for fallback slugs)
  return /^[a-z]+-[a-z]+-[a-z]+(-[a-f0-9]{4})?$/.test(slug);
}

// Export word lists for testing
export const WORD_LISTS = {
  adjectives: ADJECTIVES,
  nouns: NOUNS,
  verbs: VERBS,
} as const;
