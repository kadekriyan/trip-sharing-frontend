"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_ARTICLES } from "@/src/services/mockData";
import { adminService } from "@/src/services/admin.service";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

export default function BlogsAdminPage() {
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await adminService.getArticles();
        if (isMounted && data.length > 0) {
          setArticles(data);
        }
      } catch {
        // Fallback
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Blog & Content Management (CMS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publikasikan artikel tips perjalanan, panduan packing list, dan cerita komunitas traveler.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/blogs/new">
            <Plus className="h-4 w-4" />
            + Tulis Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Articles Card List */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari judul artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Artikel</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Penulis</th>
                <th className="px-5 py-3.5">Pembaca</th>
                <th className="px-5 py-3.5">Tanggal Terbit</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((art) => (
                <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <div className="relative h-12 w-16 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-[#191c1e] text-sm line-clamp-1 block">
                        {art.title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        /{art.slug}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="azure" className="text-[10px]">
                      {art.category}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-800 font-semibold block">{art.author.name}</span>
                    <span className="text-[10px] text-slate-400">{art.author.role}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      {art.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {formatDate(art.publishedAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
                      <Link href={`/blog/${art.slug}`} target="_blank">
                        Lihat <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
