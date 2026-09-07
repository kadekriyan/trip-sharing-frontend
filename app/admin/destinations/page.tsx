"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Plus,
  Search,
  Star,
  Clock,
  ChevronRight,
  Loader2,
  PackageOpen,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
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
import { formatCurrency, formatDuration, getDestinationTitle, getDestinationPrice, getImageUrl } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

export default function DestinationsAdminPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const reloadDestinations = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDestinations();
      setDestinations(data);
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
        const data = await adminService.getDestinations();
        if (isMounted) {
          setDestinations(data);
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionFeedback(null);
    try {
      const res = await adminService.deleteDestination(deleteTarget.id);
      setActionFeedback({ type: "success", message: res.message || "Destinasi berhasil dihapus." });
      setDeleteTarget(null);
      await reloadDestinations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus destinasi.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = Array.isArray(destinations)
    ? destinations.filter((d) => {
        if (!d) return false;
        const title = (d.title || d.tagline || "").toLowerCase();
        const location = (d.location || "").toLowerCase();
        const query = (searchQuery || "").toLowerCase();
        return title.includes(query) || location.includes(query);
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Kelola Destinasi & Paket Trip
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur paket wisata trip sharing, jadwal keberangkatan, status aktif, dan itinerary harian.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm rounded-xl">
          <Link href="/admin/destinations/new">
            <Plus className="h-4 w-4" />
            Tambah Destinasi Baru
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

      {/* Filter and Search */}
      <Card className="p-4 border border-slate-100 shadow-stitch-card bg-white">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Cari berdasarkan nama destinasi atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
          />
        </div>
      </Card>

      {/* Destinations Grid */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-6 w-6 text-[#00677d] animate-spin" />
            <span>Memuat data destinasi...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
            <PackageOpen className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Belum ada destinasi terdaftar.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/destinations/new">Tambah Destinasi Pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((dest) => {
              const title = getDestinationTitle(dest);
              const price = getDestinationPrice(dest);
              const isDestActive = dest.isActive !== false;

              return (
                <Card
                  key={dest.id}
                  className="overflow-hidden border border-slate-100 shadow-stitch-card group flex flex-col justify-between"
                >
                  <div>
                    {/* Image Container with Badges */}
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={getImageUrl(dest.coverImage || dest.image || dest.imageUrl)}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-[#a43c12] text-white px-2.5 py-1 rounded-lg text-xs font-heading font-extrabold shadow-sm">
                        {formatCurrency(price)}/pax
                      </div>

                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <Badge
                          variant={isDestActive ? "success" : "secondary"}
                          className="text-[10px] font-bold shadow-sm"
                        >
                          {isDestActive ? "Aktif" : "Non-aktif"}
                        </Badge>
                        {dest.isPopular && (
                          <Badge variant="coral" className="text-[10px] font-bold shadow-sm">
                            Populer ⭐
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#00677d] font-semibold">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{dest.location || "Indonesia"}</span>
                      </div>

                      <h3 className="font-heading font-bold text-base text-[#191c1e] line-clamp-1">
                        {title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {dest.tagline || dest.description || "Paket trip sharing seru & hemat."}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDuration(dest.durationDays || 2, dest.durationNights || 1)}
                        </span>
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {dest.rating || 4.9}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer: Edit, Delete, Pratinjau */}
                  <div className="p-4 pt-3 border-t border-slate-100 mt-2 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-1.5">
                      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1 rounded-lg">
                        <Link href={`/admin/destinations/${dest.id}/edit`}>
                          <Edit className="h-3.5 w-3.5 text-slate-600" />
                          Edit
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(dest)}
                        className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Button asChild size="sm" variant="ghost" className="h-8 text-xs text-[#00677d] gap-1">
                      <Link href={`/destinations/${dest.slug || dest.id}`}>
                        Pratinjau
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* CONFIRMATION MODAL HAPUS DESTINASI */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-1">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Hapus Paket Destinasi?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Anda akan menghapus paket wisata{" "}
              <strong className="text-slate-800">
                &ldquo;{deleteTarget ? getDestinationTitle(deleteTarget) : ""}&rdquo;
              </strong>
              . Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-1 mt-2">
            <span className="font-bold block flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              Ketentuan Integritas Data:
            </span>
            <p className="text-amber-700 leading-normal">
              Sistem akan otomatis menolak penghapusan jika destinasi ini memiliki transaksi booking peserta yang terdaftar di database.
            </p>
          </div>

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
                  Ya, Hapus Destinasi
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
