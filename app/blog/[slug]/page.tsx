"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, Calendar, Tag, Compass, Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { articleService } from "@/src/services/article.service";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      setIsLoading(true);
      try {
        const data = await articleService.getArticleBySlug(resolvedParams.slug);
        if (isMounted) {
          setArticle(data);
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadArticle();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Memuat artikel...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <PackageOpen className="h-12 w-12 text-slate-400" />
        <h2 className="font-heading font-extrabold text-xl text-[#191c1e]">
          Artikel Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Artikel dengan slug &ldquo;{resolvedParams.slug}&rdquo; tidak terdaftar di database.
        </p>
        <Button asChild>
          <Link href="/blog">Kembali ke Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* Header Bar */}
      <div className="border-b border-slate-200/80 bg-white py-3.5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#00677d] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Semua Artikel
          </Link>
          <Badge variant="coral" className="text-xs font-bold">
            {article.category}
          </Badge>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 space-y-8">
        {/* Article Meta Header */}
        <div className="space-y-4 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191c1e] leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <div className="relative h-6 w-6 rounded-full overflow-hidden bg-slate-200">
                <Image
                  src={article.author?.avatar || "/images/dest-bromo.jpg"}
                  alt={article.author?.name || "Author"}
                  fill
                  className="object-cover"
                />
              </div>
              <span>{article.author?.name || "Redaksi TripSharing"}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{article.readTimeMinutes} menit baca</span>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-stitch-card border border-slate-100">
          <Image
            src={article.coverImage || "/images/dest-bromo.jpg"}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Article Body Content */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-stitch-card space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          <p className="text-base sm:text-lg font-medium text-slate-900 border-l-4 border-[#00677d] pl-4 italic">
            &ldquo;{article.excerpt}&rdquo;
          </p>

          <div className="space-y-4 whitespace-pre-line">
            {article.content}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-slate-400" />
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold text-[#00677d] bg-[#00677d]/10 px-2.5 py-1 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA Footer */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#00677d] to-[#00a3c4] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-heading font-extrabold text-xl text-white">
              Tertarik Mencoba Rute Wisata Ini?
            </h3>
            <p className="text-xs text-slate-100">
              Lihat jadwal trip sharing berkapasitas 6 orang per mobil dan gabung sekarang.
            </p>
          </div>
          <Button asChild size="lg" className="bg-[#ff7f50] hover:bg-[#fe7e4f] text-white shrink-0 font-bold">
            <Link href="/destinations" className="gap-2">
              <Compass className="h-4 w-4" />
              Lihat Paket Wisata
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
