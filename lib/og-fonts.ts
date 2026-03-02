/**
 * Shared font loading for OG image generation (Satori/ImageResponse).
 *
 * Satori requires TTF/OTF, not woff2. The Google Fonts CSS v1 API with a
 * bare Mozilla/4.0 User-Agent returns TTF via format('truetype'). CSS v2
 * with no UA returns woff2, and CSS v2 + MSIE UA returns EOT. So v1 + bare
 * UA is the reliable path.
 *
 * Failure degrades to system sans-serif rather than crashing the image.
 */

type FontWeight = 600 | 700 | 800;

export interface OgFontEntry {
  name: string;
  data: ArrayBuffer;
  weight: FontWeight;
  style: "normal";
}

const TTF_REGEX = /font-weight:\s*(\d+)[^}]*src:\s*url\(([^)]+\.ttf[^)]*)\)/g;

export async function loadPlusJakartaSans(
  weights: FontWeight[],
): Promise<OgFontEntry[]> {
  const weightSet = new Set(weights);
  const weightParam = weights.join(",");

  try {
    const fontCss = await fetch(
      `https://fonts.googleapis.com/css?family=Plus+Jakarta+Sans:${weightParam}`,
      { headers: { "User-Agent": "Mozilla/4.0" } },
    ).then((res) => res.text());

    const ttfMatches = [...fontCss.matchAll(TTF_REGEX)];
    const entries: OgFontEntry[] = [];

    await Promise.all(
      ttfMatches.map(async ([, weightStr, url]) => {
        const w = Number(weightStr) as FontWeight;
        if (!weightSet.has(w)) return;
        const data = await fetch(url).then((r) => r.arrayBuffer());
        entries.push({
          name: "Plus Jakarta Sans",
          data,
          weight: w,
          style: "normal",
        });
      }),
    );

    return entries;
  } catch {
    // Font loading failed; caller falls back to system sans-serif
    return [];
  }
}
