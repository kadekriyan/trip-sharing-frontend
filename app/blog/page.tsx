import React from "react";
import type { Metadata } from "next";
import { articleService } from "@/src/services/article.service";
import { seoService } from "@/src/services/seo.service";
import { BlogListClient } from "@/src/components/blog/blog-list-client";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await seoService.getPageSeo("blog");
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
      url: `${siteUrl}/blog`,
      siteName: "Java Shared Tour",
      images: [
        {
          url: pageSeo.ogImage,
          width: 1200,
          height: 630,
          alt: "Blog Wisata & Tips Java Shared Tour",
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


export default async function BlogListPage() {
  const initialArticles = await articleService.getAllArticles().catch(() => []);

  return <BlogListClient initialArticles={initialArticles} />;
}
