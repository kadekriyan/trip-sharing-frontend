import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

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
