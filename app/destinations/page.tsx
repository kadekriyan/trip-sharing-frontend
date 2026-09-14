import React from "react";
import type { Metadata } from "next";
import { destinationService } from "@/src/services/destination.service";
import { DestinationsCatalogClient } from "@/src/components/destination/destinations-catalog-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

export const metadata: Metadata = {
  title: "Explore Tour Packages & Yogyakarta Sharing Trips (Max 6 Pax)",
  description:
    "Discover popular Yogyakarta tour packages: Prambanan, Merapi Lava Tour, Timang Beach, and Borobudur. Join 6-pax vehicle groups and save up to 60% with cost-sharing.",
  openGraph: {
    title: "Explore Tour Packages & Yogyakarta Sharing Trips — Share Tour Jogja",
    description:
      "Explore top Yogyakarta tourist destinations with a transparent cost-sharing system for max 6 passengers per vehicle.",
    url: `${siteUrl}/destinations`,
    siteName: "Share Tour Jogja",
    images: [
      {
        url: "/images/hero-bromo.png",
        width: 1200,
        height: 630,
        alt: "Share Tour Jogja Tour Catalog",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Tour Packages & Yogyakarta Sharing Trips — Share Tour Jogja",
    description: "Explore top Yogyakarta tourist destinations with a transparent 6-pax cost-sharing system.",
    images: ["/images/hero-bromo.png"],
  },
};

export const revalidate = 60;

export default async function DestinationsPage() {
  const initialDestinations = await destinationService.getAllDestinations().catch(() => []);

  return <DestinationsCatalogClient initialDestinations={initialDestinations} />;
}
