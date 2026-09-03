import React from "react";
import type { Metadata } from "next";
import { articleService } from "@/src/services/article.service";
import { BlogListClient } from "@/src/components/blog/blog-list-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tripsharing.id";

export const metadata: Metadata = {
  title: "Blog Wisata, Cerita Komunitas & Panduan Trip Sharing",
  description:
    "Kumpulan artikel, tips berhemat liburan, rute rekomendasi, dan edukasi seputar open trip cost-sharing maksimal 6 pax di Indonesia.",
  openGraph: {
    title: "Blog Wisata & Tips Trip Sharing Indonesia",
    description:
      "Kumpulan artikel, tips berhemat liburan, rute rekomendasi, dan edukasi seputar open trip cost-sharing.",
    url: `${siteUrl}/blog`,
    siteName: "TripSharing Indonesia",
    images: [
      {
        url: "/images/hero-bromo.png",
        width: 1200,
        height: 630,
        alt: "Blog Wisata Trip Sharing Indonesia",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Wisata & Tips Trip Sharing Indonesia",
    description: "Kumpulan artikel dan panduan open trip cost-sharing di Indonesia.",
    images: ["/images/hero-bromo.png"],
  },
};

export const revalidate = 60;

export default async function BlogListPage() {
  const initialArticles = await articleService.getAllArticles().catch(() => []);

  return <BlogListClient initialArticles={initialArticles} />;
}
