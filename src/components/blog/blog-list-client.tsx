"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight, Search, PackageOpen } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { articleService } from "@/src/services/article.service";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

interface BlogListClientProps {
  initialArticles: Article[];
}

export function BlogListClient({ initialArticles }: BlogListClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false);
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

  const filteredArticles = Array.isArray(articles)
    ? articles.filter((art) => {
        if (!art) return false;
        if (selectedCategory !== "all" && art.category !== selectedCategory) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const title = (art.title || "").toLowerCase();
          const excerpt = (art.excerpt || "").toLowerCase();
          if (!title.includes(query) && !excerpt.includes(query)) {
            return false;
          }
        }
        return true;
      })
    : [];

  const categories = ["all", "Tips Wisata", "Rute & Itinerary", "Cerita Komunitas", "Edukasi"];

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="azure" className="font-bold">
            Tips & Cerita Perjalanan
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
            Blog Wisata & Panduan Trip Sharing
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Inspirasi rute wisata alam, panduan budget travel, dan tips berteman seru di perjalanan grup kecil.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cat === "all" ? "Semua Topik" : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="blog-search-input"
              aria-label="Cari artikel blog wisata"
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50 border-slate-200 text-slate-800"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl border border-slate-200/80 bg-white p-4 space-y-4 animate-pulse">
                <div className="aspect-[16/10] w-full bg-slate-200 rounded-2xl" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <PackageOpen className="h-12 w-12 text-slate-400 mx-auto" />
            <h3 className="font-heading font-bold text-lg text-slate-800">
              Belum Ada Artikel yang Cocok
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Coba gunakan kata kunci pencarian lain atau pilih kategori topik yang berbeda.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((art) => (
              <Card
                key={art.id}
                className="group overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-stitch-card hover:shadow-stitch-card-hover transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <Image
                      src={art.coverImage || "/images/dest-bromo.jpg"}
                      alt={art.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <Badge variant="coral" className="absolute top-3.5 left-3.5 text-[10px] font-bold">
                      {art.category}
                    </Badge>
                  </div>

                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(art.publishedAt)}</span>
                      <span>•</span>
                      <span>{art.readTime || "5 Menit"}</span>
                    </div>

                    <h2 className="font-heading font-bold text-base text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-2">
                      <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                    </h2>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </CardContent>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Oleh {art.author?.name || "Redaksi"}
                  </span>

                  <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-[#00677d] gap-1 hover:bg-[#00677d]/5">
                    <Link href={`/blog/${art.slug}`}>
                      Baca Artikel
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
