import React from "react";
import type { Metadata } from "next";
import { articleService } from "@/src/services/article.service";
import { BlogListClient } from "@/src/components/blog/blog-list-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

export const metadata: Metadata = {
  title: "Travel Guides, Community Stories & Cost-Sharing Tips",
  description:
    "Explore travel articles, vacation budget tips, recommended routes, and essential guides for open trip cost-sharing tours in Yogyakarta and Indonesia.",
  openGraph: {
    title: "Travel Guides & Tips - Share Tour Jogja",
    description:
      "Explore travel articles, vacation budget tips, recommended routes, and essential guides for open trip cost-sharing tours.",
    url: `${siteUrl}/blog`,
    siteName: "Share Tour Jogja",
    images: [
      {
        url: "/images/hero-bromo.png",
        width: 1200,
        height: 630,
        alt: "Share Tour Jogja Travel Guides",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Guides & Tips - Share Tour Jogja",
    description: "Explore travel articles, vacation budget tips, and open trip guides in Indonesia.",
    images: ["/images/hero-bromo.png"],
  },
};

export const revalidate = 60;

export default async function BlogListPage() {
  const initialArticles = await articleService.getAllArticles().catch(() => []);

  return <BlogListClient initialArticles={initialArticles} />;
}
