import type { MetadataRoute } from "next";
import { destinationService } from "@/src/services/destination.service";
import { articleService } from "@/src/services/article.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/destinations`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const [destinations, articles] = await Promise.all([
      destinationService.getAllDestinations(),
      articleService.getAllArticles(),
    ]);

    const destinationUrls: MetadataRoute.Sitemap = destinations
      .filter((dest) => !dest.isUnlisted && !dest.is_unlisted && !dest.noIndex)
      .map((dest) => ({
        url: `${siteUrl}/destinations/${dest.slug}`,
        lastModified: new Date(dest.updatedAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.85,
      }));

    const articleUrls: MetadataRoute.Sitemap = articles.map((art) => ({
      url: `${siteUrl}/blog/${art.slug}`,
      lastModified: new Date(art.updatedAt || art.publishedAt || new Date()),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...destinationUrls, ...articleUrls];
  } catch {
    return staticRoutes;
  }
}
