import React from "react";
import type { Metadata } from "next";
import { seoService } from "@/src/services/seo.service";

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await seoService.getPageSeo("bookings");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

  return {
    title: pageSeo.title,
    description: pageSeo.description,
    keywords: pageSeo.keywords,
    robots: {
      index: !pageSeo.noIndex,
      follow: !pageSeo.noIndex,
    },
    openGraph: {
      title: `${pageSeo.title} — Share Tour Jogja`,
      description: pageSeo.description,
      url: `${siteUrl}/bookings`,
      siteName: "Share Tour Jogja",
      images: [
        {
          url: pageSeo.ogImage,
          width: 1200,
          height: 630,
          alt: "My Bookings & E-Ticket Share Tour Jogja",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageSeo.title} — Share Tour Jogja`,
      description: pageSeo.description,
      images: [pageSeo.ogImage],
    },
  };
}

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
