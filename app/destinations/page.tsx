import React from "react";
import type { Metadata } from "next";
import { destinationService } from "@/src/services/destination.service";
import { DestinationsCatalogClient } from "@/src/components/destination/destinations-catalog-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tripsharing.id";

export const metadata: Metadata = {
  title: "Katalog Destinasi Wisata & Open Trip Cost-Sharing (Maks 6 Pax)",
  description:
    "Jelajahi paket wisata populer Indonesia: Bromo, Labuan Bajo, Nusa Penida, Derawan, dan Toba. Gabung grup mobil 6 orang dan hemat biaya hingga 60%.",
  openGraph: {
    title: "Katalog Destinasi Wisata Open Trip — TripSharing Indonesia",
    description:
      "Jelajahi paket wisata populer Indonesia dengan sistem cost-sharing maksimal 6 orang per mobil.",
    url: `${siteUrl}/destinations`,
    siteName: "TripSharing Indonesia",
    images: [
      {
        url: "/images/hero-bromo.png",
        width: 1200,
        height: 630,
        alt: "Katalog Wisata Trip Sharing Indonesia",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Katalog Destinasi Wisata Open Trip — TripSharing Indonesia",
    description: "Jelajahi paket wisata populer Indonesia dengan sistem cost-sharing 6 pax.",
    images: ["/images/hero-bromo.png"],
  },
};

export const revalidate = 60;

export default async function DestinationsPage() {
  const initialDestinations = await destinationService.getAllDestinations().catch(() => []);

  return <DestinationsCatalogClient initialDestinations={initialDestinations} />;
}
