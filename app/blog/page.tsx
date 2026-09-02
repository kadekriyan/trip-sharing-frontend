"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight, Search, PackageOpen } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { articleService } from "@/src/services/article.service";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

export default function BlogListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadArticles() {
      setIsLoading(true);
      try {
        const data = await articleService.getAllArticles({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          search: searchQuery || undefined,
        });
        if (isMounted) {
          setArticles(data);
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadArticles();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery]);

  const filteredArticles = articles.filter((art) => {
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
            {["all", "Travel Tips", "Destinations", "Budget Travel", "Community Story"].map((cat) => (
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
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Article Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <PackageOpen className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-heading font-bold text-base text-slate-700">Belum Ada Artikel</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Belum ada artikel yang cocok dengan filter atau kata kunci ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((art) => (
              <Card
                key={art.id}
                className="overflow-hidden flex flex-col group border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={art.coverImage || "/images/dest-bromo.jpg"}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="coral" className="text-[10px] uppercase font-bold">
                      {art.category}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">
                      {formatDate(art.publishedAt)}
                    </span>
                    <h3 className="font-heading font-bold text-base text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-2">
                      <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {art.readTimeMinutes} mnt baca
                    </span>
                    <Link
                      href={`/blog/${art.slug}`}
                      className="font-bold text-[#00677d] hover:text-[#00a3c4] flex items-center gap-1"
                    >
                      Baca Artikel
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
