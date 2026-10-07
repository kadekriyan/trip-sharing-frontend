import React from "react";
import type { Metadata } from "next";
import { destinationService } from "@/src/services/destination.service";
import { seoService } from "@/src/services/seo.service";
import { DestinationsCatalogClient } from "@/src/components/destination/destinations-catalog-client";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await seoService.getPageSeo("destinations");
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
      title: `${pageSeo.title} — Java Shared Tour`,
      description: pageSeo.description,
      url: `${siteUrl}/destinations`,
      siteName: "Java Shared Tour",
      images: [
        {
          url: pageSeo.ogImage,
          width: 1200,
          height: 630,
          alt: "Java Shared Tour Catalog",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageSeo.title} — Java Shared Tour`,
      description: pageSeo.description,
      images: [pageSeo.ogImage],
    },
  };
}


export default async function DestinationsPage() {
  const initialDestinations = await destinationService.getAllDestinations().catch(() => []);

  return <DestinationsCatalogClient initialDestinations={initialDestinations} />;
}
