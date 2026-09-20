import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, Calendar, Tag, Compass, PackageOpen } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { articleService } from "@/src/services/article.service";
import { formatDate, getImageUrl } from "@/src/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await articleService.getArticleBySlug(slug).catch(() => null);

  if (!article) {
    return {
      title: "Artikel Tidak Ditemukan | Blog Share Tour Jogja",
      description: "Artikel yang Anda cari tidak ditemukan.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";
  const ogImageUrl = article.seoOgImage || article.coverImage || `${siteUrl}/images/hero-bromo.png`;
  const pageTitle = article.seoTitle || `${article.title} | Blog Wisata & Tips Tour Jogja`;
  const pageDescription = article.seoDescription || article.excerpt || article.title;
  const keywords =
    article.seoKeywords && article.seoKeywords.length > 0
      ? article.seoKeywords
      : article.tags || [];

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: article.author?.name || "Redaksi Share Tour Jogja" }],
    robots: article.noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${siteUrl}/blog/${article.slug}`,
      siteName: "Share Tour Jogja",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      type: "article",
      publishedTime: article.publishedAt,
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

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await articleService.getArticleBySlug(slug).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

  if (!article) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <PackageOpen className="h-12 w-12 text-slate-400" />
        <h1 className="font-heading font-extrabold text-xl text-[#191c1e]">
          Artikel Tidak Ditemukan
        </h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Artikel dengan tautan &ldquo;{slug}&rdquo; tidak terdaftar di database.
        </p>
        <Button asChild size="sm" className="gap-2">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Blog
          </Link>
        </Button>
      </div>
    );
  }

  let customSchemaObj: Record<string, unknown> | null = null;
  if (article.customSchemaJson) {
    try {
      customSchemaObj =
        typeof article.customSchemaJson === "string"
          ? JSON.parse(article.customSchemaJson)
          : (article.customSchemaJson as Record<string, unknown>);
    } catch {
      customSchemaObj = null;
    }
  }


  const jsonLdArticle =
    customSchemaObj || {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      image: article.coverImage,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: {
        "@type": "Person",
        name: article.author?.name || "Redaksi Share Tour Jogja",
      },
      publisher: {
        "@type": "Organization",
        name: "Share Tour Jogja",
        logo: `${siteUrl}/images/logo.png`,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${siteUrl}/blog/${article.slug}`,
      },
    };

  return (
    <article className="min-h-screen bg-[#f7f9fb] py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-slate-600 hover:text-[#00677d]">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Semua Artikel
          </Link>
        </Button>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="coral" className="text-xs font-bold px-3 py-1">
              {article.category}
            </Badge>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.readTime || "5 Menit Baca"}
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191c1e] leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-200/80 text-xs text-slate-500">
            <span className="font-bold text-slate-800">
              Oleh: {article.author?.name || "Tim Redaksi"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(article.publishedAt)}
            </span>
          </div>
        </header>

        {/* Cover Image */}
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-stitch-card border border-slate-200/80 bg-slate-900">
          <Image
            src={getImageUrl(article.coverImage)}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-3xl border border-slate-100 shadow-stitch-card space-y-6">
          <div
            className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-slate-700 space-y-4 [&_a]:text-[#00677d] [&_a]:font-semibold [&_a]:underline [&_a]:hover:text-[#004e5f] [&_strong]:font-bold [&_strong]:text-slate-900 [&_b]:font-bold [&_b]:text-slate-900 [&_em]:italic [&_i]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1.5 [&_h2]:font-heading [&_h2]:font-extrabold [&_h2]:text-2xl [&_h2]:text-[#191c1e] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-xl [&_h3]:text-[#191c1e] [&_h3]:mt-6 [&_h3]:mb-2 [&_h4]:font-heading [&_h4]:font-bold [&_h4]:text-lg [&_h4]:text-slate-800 [&_h4]:mt-4 [&_p]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-[#00677d] [&_blockquote]:bg-slate-50 [&_blockquote]:p-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:text-slate-700 [&_code]:bg-slate-100 [&_code]:text-rose-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_hr]:my-8 [&_hr]:border-slate-200"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400 mr-1" />
              {article.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA to Destinations */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#00677d] to-[#00a3c4] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="font-heading font-bold text-xl">
              Tertarik Mencoba Pengalaman Trip Sharing?
            </h2>
            <p className="text-xs text-slate-100">
              Temukan paket wisata 6 pax hemat dan pesan kursimu sekarang!
            </p>
          </div>
          <Button asChild className="bg-white text-[#00677d] hover:bg-slate-100 font-bold shrink-0 gap-2">
            <Link href="/destinations">
              <Compass className="h-4 w-4" />
              Pilih Destinasi
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
