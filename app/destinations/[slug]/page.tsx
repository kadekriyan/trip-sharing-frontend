import React from "react";
import type { Metadata } from "next";
import { destinationService } from "@/src/services/destination.service";
import { DestinationDetailClient } from "@/src/components/destination/destination-detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await destinationService.getDestinationBySlug(slug).catch(() => null);

  if (!destination) {
    return {
      title: "Paket Wisata Tidak Ditemukan | Share Tour Jogja",
      description: "Destinasi wisata yang Anda cari tidak ditemukan atau telah kedaluwarsa.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";
  const ogImageUrl = destination.coverImage || `${siteUrl}/images/hero-bromo.png`;
  const pageTitle = `${destination.title} — Open Trip Cost-Sharing (Maks 6 Pax)`;
  const pageDescription =
    destination.shortDescription ||
    destination.description ||
    `Gabung open trip ${destination.title} kapasitas maksimal 6 orang per mobil. Hemat biaya hingga 60% dan garansi berangkat 100%.`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      destination.title,
      destination.location,
      destination.category || "Wisata",
      "Trip Sharing",
      "Open Trip Indonesia",
      "Wisata 6 Orang",
    ],
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${siteUrl}/destinations/${destination.slug}`,
      siteName: "Share Tour Jogja",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Paket Wisata ${destination.title} - ${destination.location}`,
        },
      ],
      type: "website",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = await destinationService.getDestinationBySlug(slug).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

  const jsonLdTrip = destination
    ? {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: destination.title,
        description: destination.description,
        image: destination.coverImage,
        touristType: "Open Trip / Solo Traveler",
        provider: {
          "@type": "Organization",
          name: "Share Tour Jogja",
          url: siteUrl,
        },
        offers: {
          "@type": "Offer",
          price: destination.pricePerPax,
          priceCurrency: "IDR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/destinations/${destination.slug}`,
        },
      }
    : null;

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Destinasi",
        item: `${siteUrl}/destinations`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: destination?.title || slug,
        item: `${siteUrl}/destinations/${slug}`,
      },
    ],
  };

  return (
    <>
      {jsonLdTrip && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdTrip) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <DestinationDetailClient initialDestination={destination} slug={slug} />
    </>
  );
}
