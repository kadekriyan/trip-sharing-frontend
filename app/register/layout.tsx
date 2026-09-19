import React from "react";
import type { Metadata } from "next";
import { seoService } from "@/src/services/seo.service";

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await seoService.getPageSeo("register");
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
      url: `${siteUrl}/register`,
      siteName: "Share Tour Jogja",
      images: [
        {
          url: pageSeo.ogImage,
          width: 1200,
          height: 630,
          alt: pageSeo.title,
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

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
