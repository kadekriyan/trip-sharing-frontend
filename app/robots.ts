import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tripsharing.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/destinations", "/destinations/*", "/blog", "/blog/*"],
        disallow: ["/admin", "/admin/*", "/bookings", "/api/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
