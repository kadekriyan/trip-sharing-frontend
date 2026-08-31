"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_ARTICLES } from "@/src/services/mockData";
import { formatDate } from "@/src/lib/utils";

export default function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = MOCK_ARTICLES.filter((art) => {
    if (selectedCategory !== "all" && art.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !art.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !art.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="azure" className="font-bold">
            Tips & Cerita Perjalanan
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
            Blog Wisata & Panduan Trip Sharing
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Inspirasi rute wisata alam, panduan budget travel, dan tips berteman seru di perjalanan grup kecil.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-10 rounded-2xl bg-white p-4 shadow-stitch-card border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["all", "Travel Tips", "Destinations", "Budget Travel"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#00677d] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "Semua Kategori" : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari artikel tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden flex flex-col group border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all"
            >
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="coral" className="text-[10px] font-bold">
                    {article.category}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{article.readTimeMinutes} Menit Baca</span>
                    <span>•</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#191c1e] line-clamp-2 group-hover:text-[#00677d] transition-colors">
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <div className="h-6 w-6 rounded-full overflow-hidden relative">
                      <Image
                        src={article.author.avatar}
                        alt={article.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span>{article.author.name}</span>
                  </div>

                  <Link
                    href={`/blog/${article.slug}`}
                    className="text-xs font-bold text-[#00677d] hover:text-[#00a3c4] flex items-center gap-1"
                  >
                    Baca
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
