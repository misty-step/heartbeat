import { describe, test, expect } from "vitest";
import {
  generateStatusSlug,
  generateUniqueStatusSlug,
  isValidStatusSlugFormat,
  WORD_LISTS,
} from "@/convex/slugs";

interface MockCtx {
  db: {
    query: (table: string) => {
      withIndex: (
        index: string,
        q?: unknown,
      ) => { first: () => Promise<null | { _id: string }> };
    };
  };
}

describe("generateStatusSlug", () => {
  test("returns adjective-noun-verb pattern", () => {
    const slug = generateStatusSlug();
    const parts = slug.split("-");

    expect(parts).toHaveLength(3);
    expect(WORD_LISTS.adjectives).toContain(parts[0]);
    expect(WORD_LISTS.nouns).toContain(parts[1]);
    expect(WORD_LISTS.verbs).toContain(parts[2]);
  });

  test("returns different slugs on successive calls (with high probability)", () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      slugs.add(generateStatusSlug());
    }
    // With ~125K combinations, 100 random picks should almost always be unique
    expect(slugs.size).toBeGreaterThan(90);
  });

  test("returns only lowercase letters and hyphens", () => {
    for (let i = 0; i < 50; i++) {
      const slug = generateStatusSlug();
      expect(slug).toMatch(/^[a-z-]+$/);
    }
  });
});

describe("isValidStatusSlugFormat", () => {
  test("accepts valid three-word slugs", () => {
    expect(isValidStatusSlugFormat("silver-mountain-echo")).toBe(true);
    expect(isValidStatusSlugFormat("amber-cave-bloom")).toBe(true);
    expect(isValidStatusSlugFormat("frost-peak-shine")).toBe(true);
  });

  test("accepts valid slugs with hex suffix (fallback format)", () => {
    expect(isValidStatusSlugFormat("silver-mountain-echo-a1b2")).toBe(true);
    expect(isValidStatusSlugFormat("amber-cave-bloom-0000")).toBe(true);
    expect(isValidStatusSlugFormat("frost-peak-shine-ffff")).toBe(true);
  });

  test("rejects invalid formats", () => {
    expect(isValidStatusSlugFormat("")).toBe(false);
    expect(isValidStatusSlugFormat("too-few")).toBe(false);
    expect(isValidStatusSlugFormat("too-many-words-here")).toBe(false);
    expect(isValidStatusSlugFormat("Silver-Mountain-Echo")).toBe(false); // uppercase
    expect(isValidStatusSlugFormat("silver_mountain_echo")).toBe(false); // underscores
    expect(isValidStatusSlugFormat("silver-mountain-echo-abc")).toBe(false); // 3-char suffix
    expect(isValidStatusSlugFormat("silver-mountain-echo-abcde")).toBe(false); // 5-char suffix
  });

  test("all generated slugs pass validation", () => {
    for (let i = 0; i < 100; i++) {
      const slug = generateStatusSlug();
      expect(isValidStatusSlugFormat(slug)).toBe(true);
    }
  });
});

describe("WORD_LISTS", () => {
  test("all word lists have sufficient entries", () => {
    expect(WORD_LISTS.adjectives.length).toBeGreaterThanOrEqual(48);
    expect(WORD_LISTS.nouns.length).toBeGreaterThanOrEqual(48);
    expect(WORD_LISTS.verbs.length).toBeGreaterThanOrEqual(48);
  });

  test("total combinations exceed 100k", () => {
    const combinations =
      WORD_LISTS.adjectives.length *
      WORD_LISTS.nouns.length *
      WORD_LISTS.verbs.length;
    expect(combinations).toBeGreaterThan(100000);
  });

  test("all words are lowercase and contain only letters", () => {
    const allWords = [
      ...WORD_LISTS.adjectives,
      ...WORD_LISTS.nouns,
      ...WORD_LISTS.verbs,
    ];
    for (const word of allWords) {
      expect(word).toMatch(/^[a-z]+$/);
    }
  });

  test("no duplicate words within lists", () => {
    expect(new Set(WORD_LISTS.adjectives).size).toBe(
      WORD_LISTS.adjectives.length,
    );
    expect(new Set(WORD_LISTS.nouns).size).toBe(WORD_LISTS.nouns.length);
    expect(new Set(WORD_LISTS.verbs).size).toBe(WORD_LISTS.verbs.length);
  });
});

describe("generateUniqueStatusSlug", () => {
  test("returns a slug when no collision exists", async () => {
    // Mock ctx where the slug is always available (no existing record)
    const ctx: MockCtx = {
      db: {
        query: () => ({
          withIndex: () => ({
            first: async () => null,
          }),
        }),
      },
    };

    const slug = await generateUniqueStatusSlug(ctx as never, 5);
    expect(isValidStatusSlugFormat(slug)).toBe(true);
  });

  test("falls back to hex-suffixed slug after exhausting all attempts", async () => {
    // Mock ctx where every slug is already taken (always returns a record)
    const ctx: MockCtx = {
      db: {
        query: () => ({
          withIndex: () => ({
            first: async () => ({ _id: "existing" }),
          }),
        }),
      },
    };

    const slug = await generateUniqueStatusSlug(ctx as never, 3);
    // Fallback slug appends a 4-char hex suffix: word-word-word-xxxx
    expect(slug).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[0-9a-f]{4}$/);
  });
});
