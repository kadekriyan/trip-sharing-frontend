"use client";

import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, Calendar, Tag, Compass } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { MOCK_ARTICLES } from "@/src/services/mockData";
import { formatDate } from "@/src/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const article =
    MOCK_ARTICLES.find((a) => a.slug === resolvedParams.slug || a.id === resolvedParams.slug) ||
    MOCK_ARTICLES[0];

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
              <div className="relative h-6 w-6 rounded-full overflow-hidden">
                <Image src={article.author.avatar} alt={article.author.name} fill className="object-cover" />
              </div>
              <span>{article.author.name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{article.readTimeMinutes} Menit Baca</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-stitch-card border border-slate-100">
          <Image src={article.coverImage} alt={article.title} fill className="object-cover" priority />
        </div>

        {/* Excerpt Lead */}
        <div className="p-6 rounded-2xl bg-sky-50/70 border border-sky-100 text-sm text-[#00677d] font-medium leading-relaxed">
          {article.excerpt}
        </div>

        {/* Body Content */}
        <div className="prose prose-slate max-w-none text-slate-700 space-y-4 leading-relaxed text-sm sm:text-base">
          <p>
            Traveling kini tidak lagi harus mahal atau rumit. Konsep <strong>trip sharing</strong> (berbagi perjalanan) memungkinkan traveler solo maupun kelompok kecil untuk menyewa armada bersama maksimal 6 orang per mobil.
          </p>
          <h3 className="font-heading font-bold text-xl text-[#191c1e] mt-6">
            Kenapa Trip Sharing Menjadi Tren Favorit?
          </h3>
          <p>
            Bagi banyak orang, biaya sewa transportasi lokal dan pemandu wisata sering kali menjadi komponen paling mahal saat liburan ke destinasi seperti Gunung Bromo atau Labuan Bajo. Dengan sistem auto-grouping, setiap kursi dihitung proporsional sehingga Anda hanya membayar kursi yang Anda pakai.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
            <li><strong>Hemat Biaya Hingga 60%</strong> dibanding sewa mobil private secara individu.</li>
            <li><strong>Grup Nyaman Maks 6 Orang</strong> menjamin ruang gerak dan privasi yang tetap terjaga.</li>
            <li><strong>Teman Perjalanan Baru</strong> dari berbagai kota dengan minat dan hobi yang sama.</li>
          </ul>
        </div>

        {/* Tags & Share */}
        <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-slate-400" />
            {article.tags.map((tag, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
                #{tag}
              </span>
            ))}
          </div>

          <Button asChild size="sm" className="gap-2">
            <Link href="/destinations">
              <Compass className="h-4 w-4" />
              Cari Trip Terkait
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
