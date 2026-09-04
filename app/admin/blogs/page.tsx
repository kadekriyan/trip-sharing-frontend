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
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { adminService } from "@/src/services/admin.service";
import { formatDate } from "@/src/lib/utils";
import type { Article } from "@/src/types";

export default function BlogsAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const reloadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getArticles();
      setArticles(data);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
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

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleStatus = async (article: Article) => {
    setTogglingId(article.id);
    setActionFeedback(null);
    try {
      const currentActive = article.isActive !== undefined ? Boolean(article.isActive) : article.isPublished !== false;
      await adminService.toggleArticleStatus(article.id, currentActive);
      setActionFeedback({
        type: "success",
        message: `Status artikel "${article.title}" berhasil diubah menjadi ${!currentActive ? "Published (Aktif)" : "Draft (Non-aktif)"}.`,
      });
      await reloadArticles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status artikel.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionFeedback(null);
    try {
      const res = await adminService.deleteArticle(deleteTarget.id);
      setActionFeedback({ type: "success", message: res.message || "Artikel berhasil dihapus." });
      setDeleteTarget(null);
      await reloadArticles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus artikel.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = Array.isArray(articles)
    ? articles.filter((a) => {
        if (!a) return false;
        const title = (a.title || "").toLowerCase();
        const category = (a.category || "").toLowerCase();
        const query = (searchQuery || "").toLowerCase();
        return title.includes(query) || category.includes(query);
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            CMS Artikel & Blog Wisata
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola publikasi artikel, tips perjalanan, status draft/publish, dan konten edukasi seputar trip sharing.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm rounded-xl">
          <Link href="/admin/blogs/new">
            <Plus className="h-4 w-4" />
            Tulis Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-xs font-semibold">{actionFeedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6 bg-white">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari judul artikel atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total {filtered.length} Artikel Terdaftar
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
            <p className="text-xs font-semibold text-slate-600">Belum ada artikel yang terdaftar.</p>
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
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((art) => {
                  const isArtActive = art.isActive !== undefined ? Boolean(art.isActive) : art.isPublished !== false;
                  const isToggling = togglingId === art.id;

                  return (
                    <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                              src={art.coverImage || "/images/dest-bromo.jpg"}
                              alt={art.title || "Cover Artikel"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-heading font-bold text-xs text-[#191c1e] line-clamp-1 hover:text-[#00677d]">
                              <Link href={`/blog/${art.slug || art.id}`}>{art.title || "Artikel Tanpa Judul"}</Link>
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
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleToggleStatus(art)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            isArtActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                          title={isArtActive ? "Klik untuk jadikan Draft / Non-aktif" : "Klik untuk Publikasikan"}
                        >
                          {isToggling ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isArtActive ? (
                            <Eye className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-slate-400" />
                          )}
                          <span>{isArtActive ? "Published" : "Draft / Non-aktif"}</span>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        <span>{formatDate(art.publishedAt || art.createdAt || new Date().toISOString())}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Link href={`/admin/blogs/${art.id}/edit`}>
                              <Edit className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(art)}
                            className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Hapus</span>
                          </Button>

                          <Button asChild size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-[#00677d] gap-1">
                            <Link href={`/blog/${art.slug || art.id}`}>
                              Lihat
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CONFIRMATION MODAL HAPUS ARTIKEL */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-1">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Hapus Artikel Blog?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Anda akan menghapus artikel{" "}
              <strong className="text-slate-800">&ldquo;{deleteTarget?.title}&rdquo;</strong> secara permanen. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl gap-1.5 shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Ya, Hapus Artikel
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
