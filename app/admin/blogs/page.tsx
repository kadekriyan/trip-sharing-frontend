"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  ChevronRight,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { adminService } from "@/src/services/admin.service";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

export default function BlogsAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await adminService.getArticles();
        if (isMounted) {
          setArticles(data);
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            CMS Artikel & Blog Wisata
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publikasikan tips perjalanan, rute rekomendasi, dan edukasi seputar trip sharing Indonesia.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/blogs/new">
            <Plus className="h-4 w-4" />
            Tulis Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari judul artikel atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total {filtered.length} Artikel Diterbitkan
          </span>
        </div>

        {/* Blog Stream */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-6 w-6 text-[#00677d] animate-spin" />
            <span>Memuat data artikel...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
            <PackageOpen className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Belum ada artikel yang diterbitkan.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/blogs/new">Buat Artikel Pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Artikel</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Penulis</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <Image
                            src={art.coverImage || "/images/dest-bromo.jpg"}
                            alt={art.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading font-bold text-xs text-[#191c1e] line-clamp-1 hover:text-[#00677d]">
                            <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                          </h3>
                          <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {art.excerpt}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="coral" className="text-[10px] font-bold">
                        {art.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700">
                        {art.author?.name || "Redaksi"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <span>{formatDate(art.publishedAt)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild size="sm" variant="ghost" className="h-8 text-xs text-[#00677d] gap-1">
                        <Link href={`/blog/${art.slug}`}>
                          Lihat
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
