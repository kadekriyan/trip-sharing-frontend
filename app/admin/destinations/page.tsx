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
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { adminService } from "@/src/services/admin.service";
import { formatCurrency, formatDuration } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

export default function DestinationsAdminPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
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
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = destinations.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Kelola Destinasi & Paket Trip
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur paket wisata trip sharing, jadwal keberangkatan, dan itinerary harian.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/destinations/new">
            <Plus className="h-4 w-4" />
            Tambah Destinasi Baru
          </Link>
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama destinasi atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total {filtered.length} Destinasi Terdaftar
          </span>
        </div>

        {/* Grid Stream */}
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
            {filtered.map((dest) => (
              <Card
                key={dest.id}
                className="overflow-hidden border border-slate-100 shadow-stitch-card group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={dest.coverImage || "/images/dest-bromo.jpg"}
                      alt={dest.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-[#a43c12] text-white px-2.5 py-1 rounded-lg text-xs font-heading font-extrabold shadow-sm">
                      {formatCurrency(dest.pricePerPax)}/pax
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#00677d] font-semibold">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{dest.location}</span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-[#191c1e] line-clamp-1">
                      {dest.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {dest.tagline || dest.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDuration(dest.durationDays, dest.durationNights)}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {dest.rating || 4.9}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    ID: {dest.id.slice(0, 8)}...
                  </span>

                  <Button asChild size="sm" variant="ghost" className="text-xs text-[#00677d] gap-1">
                    <Link href={`/destinations/${dest.slug}`}>
                      Pratinjau
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
