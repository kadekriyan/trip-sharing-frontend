"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Eye,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_ARTICLES } from "@/src/services/mockData";
import { formatDate } from "@/src/lib/utils";

export default function BlogCMSAdminPage() {
  const [articles] = useState(MOCK_ARTICLES);
  const [searchQuery, setSearchQuery] = useState("");

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
            CMS Artikel & Cerita Perjalanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tulis tips berhemat, inspirasi destinasi, dan panduan perjalanan untuk komunitas trip sharing.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/blogs/new">
            <Plus className="h-4 w-4" />
            + Tulis Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-100 text-[#00677d] flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Total Artikel Terbit</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              {articles.length} Post
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Status Publikasi</span>
            <span className="font-heading font-extrabold text-xl text-emerald-700 block">
              100% Live
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#ff7f50] flex items-center justify-center">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">SEO Optimization</span>
            <span className="font-heading font-extrabold text-xl text-[#ff7f50] block">
              Skor 92/100
            </span>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-stitch-card border border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari judul artikel atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Total: {filtered.length} Artikel
        </span>
      </div>

      {/* Articles Table */}
      <div className="rounded-2xl bg-white shadow-stitch-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Artikel & Cover</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Penulis</th>
                <th className="px-5 py-3.5">Tanggal Terbit</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((art) => (
                <tr key={art.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                        <Image
                          src={art.coverImage}
                          alt={art.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">
                          {art.title}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                          {art.excerpt}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant="coral" className="text-[10px]">
                      {art.category}
                    </Badge>
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-700">
                    {art.authorName}
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(art.publishedAt)}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant="success" className="text-[10px]">
                      Published
                    </Badge>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <Link href={`/blog/${art.slug}`}>
                        <Eye className="h-3.5 w-3.5" />
                        Pratinjau
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
