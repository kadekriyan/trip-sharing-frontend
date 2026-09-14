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
      title: "Tour Package Not Found | Share Tour Jogja",
      description: "The tour destination you are looking for was not found or is no longer available.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";
  const ogImageUrl = destination.coverImage || `${siteUrl}/images/hero-bromo.png`;
  const pageTitle = `${destination.title} — Yogyakarta Sharing Tour (Max 6 Pax)`;
  const pageDescription =
    destination.shortDescription ||
    destination.description ||
    `Join ${destination.title} open trip with maximum 6 guests per vehicle. Save up to 60% with guaranteed departure.`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      destination.title,
      destination.location,
      destination.category || "Tour",
      "Trip Sharing",
      "Open Trip Yogyakarta",
      "6 Pax Sharing Tour",
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
          alt: `Tour Package ${destination.title} - ${destination.location}`,
        },
      ],
      type: "website",
      locale: "en_US",
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
        name: "Explore Tours",
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
