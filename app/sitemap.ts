import type { MetadataRoute } from "next";
import { fetchPublicQuery } from "@/lib/convex-public";
import { api } from "@/convex/_generated/api";

const BASE_URL = "https://heartbeat.cool";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let statusPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await fetchPublicQuery(
      api.monitors.listPublicStatusSlugs,
      {},
    );
    statusPages = slugs.map((slug) => ({
      url: `${BASE_URL}/status/${slug}`,
      changeFrequency: "always" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("sitemap: failed to fetch public status slugs", e);
  }

  return [...staticPages, ...statusPages];
}
